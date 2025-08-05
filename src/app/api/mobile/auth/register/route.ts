import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";

// Validation schema for user registration
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  image: z.string().optional(),
  DateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.string().optional(),
  address: z.string().optional(),
  contactNumber: z.string().optional(),
});

export async function POST(request: NextRequest) {
  console.log("register", request)
  
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = registerSchema.parse(body);
    
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const hashePassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username: validatedData.username,
        password: hashePassword, 
        name: validatedData.name,
        middleName: validatedData.middleName,
        lastName: validatedData.lastName,
        image: validatedData.image,
        DateOfBirth: validatedData.DateOfBirth,
        age: validatedData.age,
        address: validatedData.address,
        contactNumber: validatedData.contactNumber,
        status: "PENDING", // Default status as per schema
        isAlreadyRegisteredIn0auth: false, // Default value as per schema
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
        // Exclude password from response for security
      },
    });
    
    return NextResponse.json(
      {
        message: "User registered successfully",
        user: newUser,
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Registration error:", error);
    
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
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}