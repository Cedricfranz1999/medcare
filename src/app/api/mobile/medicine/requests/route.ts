import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";

// Validation schema for query parameters
const querySchema = z.object({
  userId: z.number().min(1).optional(), // Filter by specific user
  status: z.enum(["REQUESTED", "GIVEN", "CANCELLED"]).optional(), // Filter by status
  page: z.number().min(1).default(1), // Page number for pagination
  limit: z.number().min(1).max(100).default(20), // Items per page
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const params = {
      userId: searchParams.get("userId") ? parseInt(searchParams.get("userId")!) : undefined,
      status: searchParams.get("status") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };
    
    const validatedParams = querySchema.parse(params);
    
    // Build where conditions
    const whereConditions: any = {};
    
    if (validatedParams.userId) {
      whereConditions.userId = validatedParams.userId;
    }
    
    if (validatedParams.status) {
      whereConditions.status = validatedParams.status;
    }
    
    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    
    // Execute query
    const [requests, totalCount] = await Promise.all([
      prisma.medicineRequestor.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            }
          },
          medicines: {
            include: {
              medicine: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  image: true,
                  stock: true,
                  type: true,
                  dosageForm: true,
                }
              }
            }
          }
        },
        orderBy: [
          { createdAt: "desc" }, // Most recent first
        ],
        skip,
        take: validatedParams.limit,
      }),
      prisma.medicineRequestor.count({
        where: whereConditions,
      })
    ]);
    
    // Transform the response
    const transformedRequests = requests.map(request => ({
      id: request.id,
      userId: request.userId,
      reason: request.reason,
      status: request.status,
      requestedAt: request.requestedAt,
      approvedAt: request.approvedAt,
      givenAt: request.givenAt,
      cancelledReason: request.cancelledReason,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      user: request.user,
      medicines: request.medicines.map(item => ({
        id: item.id,
        medicineId: item.medicineId,
        quantity: item.quantity,
        medicine: item.medicine,
      })),
      totalMedicines: request.medicines.length,
      totalQuantity: request.medicines.reduce((sum, item) => sum + item.quantity, 0),
    }));
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / validatedParams.limit);
    const hasNextPage = validatedParams.page < totalPages;
    const hasPreviousPage = validatedParams.page > 1;
    
    // Get status counts for summary
    const statusCounts = await Promise.all([
      prisma.medicineRequestor.count({ where: { status: "REQUESTED" } }),
      prisma.medicineRequestor.count({ where: { status: "GIVEN" } }),
      prisma.medicineRequestor.count({ where: { status: "CANCELLED" } }),
    ]);
    
    return NextResponse.json({
      requests: transformedRequests,
      pagination: {
        currentPage: validatedParams.page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit: validatedParams.limit,
      },
      filters: {
        userId: validatedParams.userId,
        status: validatedParams.status,
      },
      summary: {
        total: totalCount,
        requested: statusCounts[0],
        given: statusCounts[1],
        cancelled: statusCounts[2],
      }
    });
    
  } catch (error) {
    console.error("Medicine requests error:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Invalid query parameters", 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: "Failed to fetch medicine requests" },
      { status: 500 }
    );
  }
}
