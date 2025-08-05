import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";

// Validation schema for query parameters (GET request)
const querySchema = z.object({
  userId: z.number().min(1, "User ID is required"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const params = {
      userId: parseInt(searchParams.get("userId") || "0"),
    };
    
    const validatedParams = querySchema.parse(params);
    
    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: validatedParams.userId },
      select: {
        id: true,
        username: true,
        name: true,
        middleName: true,
        lastName: true,
        image: true,
        DateOfBirth: true,
        age: true,
        address: true,
        contactNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        isAlreadyRegisteredIn0auth: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get user statistics
    const [cartCount, requestCount] = await Promise.all([
      prisma.medicineCart.count({
        where: { userId: validatedParams.userId },
      }),
      prisma.medicineRequestor.count({
        where: { userId: validatedParams.userId },
      }),
    ]);
    
    return NextResponse.json({
      profile: user,
      statistics: {
        cartItems: cartCount,
        totalRequests: requestCount,
      },
    });
    
  } catch (error) {
    console.error("Profile fetch error:", error);
    
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
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
} 