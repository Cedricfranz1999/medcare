import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";

// Validation schema for delete from cart request
const deleteFromCartSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  cartItemId: z.number().min(1, "Cart item ID is required"),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = deleteFromCartSchema.parse(body);
    
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
    
    // Check if cart item exists and belongs to the user
    const cartItem = await prisma.medicineCart.findFirst({
      where: {
        id: validatedData.cartItemId,
        userId: validatedData.userId,
      },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            brand: true,
            image: true,
          }
        }
      }
    });
    
    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found or does not belong to user" },
        { status: 404 }
      );
    }
    
    // Delete the cart item
    await prisma.medicineCart.delete({
      where: { id: validatedData.cartItemId },
    });
    
    // Get updated cart count for user
    const cartCount = await prisma.medicineCart.count({
      where: { userId: validatedData.userId },
    });
    
    return NextResponse.json(
      {
        message: "Item removed from cart successfully",
        deletedItem: {
          id: cartItem.id,
          medicineId: cartItem.medicineId,
          quantity: cartItem.quantity,
          medicine: cartItem.medicine,
        },
        cartCount,
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Delete from cart error:", error);
    
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
      { error: "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}
