import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";

// Validation schema for profile update (PUT request)
const updateProfileSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  DateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.string().optional(),
  address: z.string().optional(),
  contactNumber: z.string().optional(),
  image: z.string().optional(),
});

// Validation schema for password update
const updatePasswordSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Password confirmation is required"),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a password update or profile update
    if (body.currentPassword && body.newPassword) {
      // Password update
      const validatedData = updatePasswordSchema.parse(body);
      
      // Verify current password
      const user = await prisma.user.findUnique({
        where: { id: validatedData.userId },
        select: { password: true },
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword, 
        String(user.password)
      );
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
      
      // Check if new passwords match
      if (validatedData.newPassword !== validatedData.confirmPassword) {
        return NextResponse.json(
          { error: "New passwords do not match" },
          { status: 400 }
        );
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);
      
      // Update password
      await prisma.user.update({
        where: { id: validatedData.userId },
        data: { password: hashedPassword },
      });
      
      return NextResponse.json({
        message: "Password updated successfully",
      });
      
    } else {
      // Profile update
      const validatedData = updateProfileSchema.parse(body);
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: validatedData.userId },
      });
      
      if (!existingUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      // Update profile
      const updatedUser = await prisma.user.update({
        where: { id: validatedData.userId },
        data: {
          name: validatedData.name,
          middleName: validatedData.middleName,
          lastName: validatedData.lastName,
          DateOfBirth: validatedData.DateOfBirth,
          age: validatedData.age,
          address: validatedData.address,
          contactNumber: validatedData.contactNumber,
          image: validatedData.image,
        },
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
      
      return NextResponse.json({
        message: "Profile updated successfully",
        profile: updatedUser,
      });
    }
    
  } catch (error) {
    console.error("Profile update error:", error);
    
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
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
} 