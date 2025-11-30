import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";

// Validation schema for medicine request (single user, multiple medicines)
const medicineRequestSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  reason: z.string().min(1, "Reason is required"),
  medicines: z.array(z.object({
    medicineId: z.number().min(1, "Medicine ID is required"),
  })).min(1, "At least one medicine is required").max(20, "Maximum 20 medicines allowed per request"),
});

// Validation schema for bulk medicine requests (multiple users, multiple medicines each)
const bulkMedicineRequestSchema = z.object({
  requests: z.array(medicineRequestSchema).min(1, "At least one request is required").max(10, "Maximum 10 requests allowed per bulk operation"),
});

// Type for validated request data
type ValidatedRequestData = z.infer<typeof medicineRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a bulk request (multiple users) or single user request (multiple medicines)
    let isBulkRequest = false;
    let validatedData: { requests: ValidatedRequestData[] };
    
    try {
      // Try to validate as bulk request first (multiple users)
      validatedData = bulkMedicineRequestSchema.parse(body);
      isBulkRequest = true;
    } catch {
      try {
        // If not bulk, validate as single user request (multiple medicines)
        validatedData = { requests: [medicineRequestSchema.parse(body)] };
        isBulkRequest = false;
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid request format. Expected either single user request with multiple medicines or bulk requests with 'requests' array for multiple users." },
          { status: 400 }
        );
      }
    }
    
    const requests = validatedData.requests;
    
    // Check if all users exist and are approved
    const userIds = [...new Set(requests.map((req: ValidatedRequestData) => req.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });
    
    if (users.length !== userIds.length) {
      return NextResponse.json(
        { error: "One or more users not found" },
        { status: 404 }
      );
    }
    
    // Check user approval status
    const unapprovedUsers = users.filter(user => user.status !== "APPROVED");
    if (unapprovedUsers.length > 0) {
      return NextResponse.json(
        { 
          error: "One or more user accounts not approved", 
          unapprovedUsers: unapprovedUsers.map(u => ({ userId: u.id, status: u.status }))
        },
        { status: 403 }
      );
    }
    
    // Collect all medicine IDs and validate medicines exist
    const allMedicineIds = [...new Set(requests.flatMap((req: ValidatedRequestData) => req.medicines.map((item) => item.medicineId)))];
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: allMedicineIds } },
    });
    
    if (medicines.length !== allMedicineIds.length) {
      return NextResponse.json(
        { error: "One or more medicines not found" },
        { status: 404 }
      );
    }
    
    // Check stock availability for all medicines
    // const stockErrors = [];
    // for (const request of requests) {
    //   for (const requestItem of request.medicines) {
    //     const medicine = medicines.find(m => m.id === requestItem.medicineId);
    //     if (medicine && medicine.stock < requestItem.quantity) {
    //       stockErrors.push({
    //         userId: request.userId,
    //         medicineId: requestItem.medicineId,
    //         medicineName: medicine.name,
    //         requestedQuantity: requestItem.quantity,
    //         availableStock: medicine.stock,
    //       });
    //     }
    //   }
    // }
    
    // if (stockErrors.length > 0) {
    //   return NextResponse.json(
    //     { 
    //       error: "Insufficient stock for some medicines",
    //       stockErrors 
    //     },
    //     { status: 400 }
    //   );
    // }
    
    // Create all medicine requests with transaction
    const createdResults = await prisma.$transaction(async (tx) => {
      const allResults = [];
      
      for (const requestData of requests) {
        // Create the main request
        const medicineRequest = await tx.medicineRequestor.create({
          data: {
            userId: requestData.userId,
            reason: requestData.reason,
            status: "REQUESTED",
          },
        });
        
        // Create request items
        const requestItems = await Promise.all(
          requestData.medicines.map(async (item) => {
            return await tx.medicineRequestItem.create({
              data: {
                requestId: medicineRequest.id,
                medicineId: item.medicineId,
                quantity: 0,
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
        
        allResults.push({
          request: medicineRequest,
          items: requestItems,
        });
      }
      
      return allResults;
    });
    
    // Get total request counts for all users
    const userRequestCounts = await Promise.all(
      userIds.map(async (userId: number) => {
        const count = await prisma.medicineRequestor.count({
          where: { userId },
        });
        return { userId, totalRequests: count };
      })
    );
    
    const responseData = {
      message: isBulkRequest 
        ? `Successfully created ${createdResults.length} medicine request(s) for ${userIds.length} user(s)`
        : `Successfully created medicine request with ${createdResults[0]?.items.length} medicine(s)`,
      requests: createdResults.map(result => ({
        id: result.request.id,
        userId: result.request.userId,
        reason: result.request.reason,
        status: result.request.status,
        requestedAt: result.request.requestedAt,
        createdAt: result.request.createdAt,
        updatedAt: result.request.updatedAt,
        medicines: result.items.map(item => ({
          id: item.id,
          medicineId: item.medicineId,
          quantity: item.quantity,
          medicine: item.medicine,
        })),
      })),
      userRequestCounts,
      totalRequestsCreated: createdResults.length,
      totalMedicinesRequested: createdResults.reduce((total, result) => total + result.items.length, 0),
    };
    
    return NextResponse.json(responseData, { status: 201 });
    
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
      { error: "Failed to create medicine request(s)" },
      { status: 500 }
    );
  }
}