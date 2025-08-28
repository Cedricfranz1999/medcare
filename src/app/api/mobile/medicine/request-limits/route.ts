import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";

// Validation schema for query parameters
const querySchema = z.object({
  userId: z.number().min(1, "User ID is required"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const params = {
      userId: searchParams.get("userId") ? parseInt(searchParams.get("userId")!) : undefined,
    };
    
    const validatedParams = querySchema.parse(params);
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedParams.userId },
      select: {
        id: true,
        name: true,
        username: true,
        status: true,
      }
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
          userStatus: user.status 
        },
        { status: 403 }
      );
    }
    
    // Get current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Get request counts for current month
    const [currentMonthRequests, approvedRequests] = await Promise.all([
      // Count all requests for current month (REQUESTED status)
      prisma.medicineRequestor.count({
        where: {
          userId: validatedParams.userId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      // Count approved/given requests for current month (GIVEN status)
      prisma.medicineRequestor.count({
        where: {
          userId: validatedParams.userId,
          status: "GIVEN",
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ]);
    
    const responseData = {
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        currentCount: currentMonthRequests,
        approvedCount: approvedRequests,
    };
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error("Request limits check error:", error);
    
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
      { error: "Failed to check request limits" },
      { status: 500 }
    );
  }
}
