import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Validation schema for user signin
const signinSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Generate JWT access token
function generateAccessToken(userId: number, username: string): string {
  const payload = {
    userId,
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };
  
  const secret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
  return jwt.sign(payload, secret, { algorithm: "HS256" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = signinSchema.parse(body);
    
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, String(user.password));
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }
    
    // Generate access token
    const accessToken = generateAccessToken(user.id, user.username);
    
    // Return user data (excluding password)
    const userData = {
      id: user.id,
      username: user.username,
      name: user.name,
      middleName: user.middleName,
      lastName: user.lastName,
      image: user.image,
      DateOfBirth: user.DateOfBirth,
      age: user.age,
      address: user.address,
      contactNumber: user.contactNumber,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    return NextResponse.json(
      {
        message: "Signin successful",
        user: userData,
        accessToken,
        tokenType: "Bearer",
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Signin error:", error);
    
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
      { error: "Failed to signin" },
      { status: 500 }
    );
  }
}
