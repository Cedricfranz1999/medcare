import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";

// Validation schema for medicine request
const medicineRequestSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  reason: z.string().min(1, "Reason is required"),
  medicines: z.array(z.object({
    medicineId: z.number().min(1, "Medicine ID is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
  })).min(1, "At least one medicine is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = medicineRequestSchema.parse(body);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user is approved
    if (user.status !== "APPROVED") {
      return NextResponse.json(
        { 
          error: "User account not approved", 
          status: user.status 
        },
        { status: 403 }
      );
    }
    
    // Validate all medicines exist and have sufficient stock
    const medicineIds = validatedData.medicines.map(item => item.medicineId);
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
    });
    
    if (medicines.length !== medicineIds.length) {
      return NextResponse.json(
        { error: "One or more medicines not found" },
        { status: 404 }
      );
    }
    
    // Check stock availability for each medicine
    const stockErrors = [];
    for (const requestItem of validatedData.medicines) {
      const medicine = medicines.find(m => m.id === requestItem.medicineId);
      if (medicine && medicine.stock < requestItem.quantity) {
        stockErrors.push({
          medicineId: requestItem.medicineId,
          medicineName: medicine.name,
          requestedQuantity: requestItem.quantity,
          availableStock: medicine.stock,
        });
      }
    }
    
    if (stockErrors.length > 0) {
      return NextResponse.json(
        { 
          error: "Insufficient stock for some medicines",
          stockErrors 
        },
        { status: 400 }
      );
    }
    
    // Create medicine request with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the main request
      const medicineRequest = await tx.medicineRequestor.create({
        data: {
          userId: validatedData.userId,
          reason: validatedData.reason,
          status: "REQUESTED",
        },
      });
      
      // Create request items
      const requestItems = await Promise.all(
        validatedData.medicines.map(async (item) => {
          return await tx.medicineRequestItem.create({
            data: {
              requestId: medicineRequest.id,
              medicineId: item.medicineId,
              quantity: item.quantity,
            },
            include: {
              medicine: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  image: true,
                  stock: true,
                }
              }
            }
          });
        })
      );
      
      return {
        request: medicineRequest,
        items: requestItems,
      };
    });
    
    // Get user's total request count
    const totalRequests = await prisma.medicineRequestor.count({
      where: { userId: validatedData.userId },
    });
    
    return NextResponse.json(
      {
        message: "Medicine request created successfully",
        request: {
          id: result.request.id,
          userId: result.request.userId,
          reason: result.request.reason,
          status: result.request.status,
          requestedAt: result.request.requestedAt,
          createdAt: result.request.createdAt,
          updatedAt: result.request.updatedAt,
        },
        medicines: result.items.map(item => ({
          id: item.id,
          medicineId: item.medicineId,
          quantity: item.quantity,
          medicine: item.medicine,
        })),
        totalRequests,
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Medicine request error:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: "Failed to create medicine request" },
      { status: 500 }
    );
  }
}
