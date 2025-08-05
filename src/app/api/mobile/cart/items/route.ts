import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";

// Validation schema for query parameters
const querySchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  page: z.number().min(1).default(1), // Page number for pagination
  limit: z.number().min(1).max(100).default(20), // Items per page
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const params = {
      userId: parseInt(searchParams.get("userId") || "0"),
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };
    
    const validatedParams = querySchema.parse(params);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedParams.userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    
    // Execute query
    const [cartItems, totalCount] = await Promise.all([
      prisma.medicineCart.findMany({
        where: {
          userId: validatedParams.userId,
        },
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              brand: true,
              description: true,
              type: true,
              dosageForm: true,
              size: true,
              stock: true,
              recommended: true,
              image: true,
              createdAt: true,
              updatedAt: true,
            }
          }
        },
        orderBy: [
          { addedAt: "desc" }, // Most recently added first
        ],
        skip,
        take: validatedParams.limit,
      }),
      prisma.medicineCart.count({
        where: {
          userId: validatedParams.userId,
        },
      })
    ]);
    
    // Transform the response
    const transformedCartItems = cartItems.map(item => ({
      id: item.id,
      userId: item.userId,
      medicineId: item.medicineId,
      quantity: item.quantity,
      addedAt: item.addedAt,
      updatedAt: item.updatedAt,
      medicine: item.medicine,
      // Calculate if item is available based on stock
      isAvailable: item.medicine.stock >= item.quantity,
      availableStock: item.medicine.stock,
    }));
    
    // Calculate cart summary
    const cartSummary = {
      totalItems: totalCount,
      totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      availableItems: cartItems.filter(item => item.medicine.stock >= item.quantity).length,
      outOfStockItems: cartItems.filter(item => item.medicine.stock < item.quantity).length,
    };
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / validatedParams.limit);
    const hasNextPage = validatedParams.page < totalPages;
    const hasPreviousPage = validatedParams.page > 1;
    
    return NextResponse.json({
      cartItems: transformedCartItems,
      cartSummary,
      pagination: {
        currentPage: validatedParams.page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit: validatedParams.limit,
      },
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      }
    });
    
  } catch (error) {
    console.error("Cart items error:", error);
    
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
      { error: "Failed to fetch cart items" },
      { status: 500 }
    );
  }
}
