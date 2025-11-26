import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";

// Validation schema for add to cart request
const addToCartSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  medicineId: z.number().min(1, "Medicine ID is required"),
  // quantity: z.number().min(1, "Quantity must be at least 1"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = addToCartSchema.parse(body);
    
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
    
    // Check if medicine exists and has sufficient stock
    const medicine = await prisma.medicine.findUnique({
      where: { id: validatedData.medicineId },
    });
    
    if (!medicine) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }
    
    // if (medicine.stock < validatedData.quantity) {
    //   return NextResponse.json(
    //     { 
    //       error: "Insufficient stock", 
    //       availableStock: medicine.stock,
    //       requestedQuantity: validatedData.quantity
    //     },
    //     { status: 400 }
    //   );
    // }
    
    // Check if item already exists in cart
    const existingCartItem = await prisma.medicineCart.findFirst({
      where: {
        userId: validatedData.userId,
        medicineId: validatedData.medicineId,
      },
    });
    
    let cartItem;
    
    if (existingCartItem) {
      // Update existing cart item
      // const newQuantity = existingCartItem.quantity + validatedData.quantity;
      
      // Check if new total quantity exceeds stock
      // if (medicine.stock < newQuantity) {
      //   return NextResponse.json(
      //     { 
      //       error: "Insufficient stock for total quantity", 
      //       availableStock: medicine.stock,
      //       currentQuantity: existingCartItem.quantity,
      //       requestedQuantity: validatedData.quantity,
      //       totalQuantity: newQuantity
      //     },
      //     { status: 400 }
      //   );
      // }
      
      cartItem = await prisma.medicineCart.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: 0,
          updatedAt: new Date(),
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
    } else {
      // Create new cart item
      cartItem = await prisma.medicineCart.create({
        data: {
          userId: validatedData.userId,
          medicineId: validatedData.medicineId,
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
    }
    
    // Get updated cart count for user
    const cartCount = await prisma.medicineCart.count({
      where: { userId: validatedData.userId },
    });
    
    return NextResponse.json(
      {
        message: "Item added to cart successfully",
        cartItem: {
          id: cartItem.id,
          userId: cartItem.userId,
          medicineId: cartItem.medicineId,
          quantity: cartItem.quantity,
          addedAt: cartItem.addedAt,
          updatedAt: cartItem.updatedAt,
          medicine: cartItem.medicine,
        },
        cartCount,
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Add to cart error:", error);
    
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
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}