import { type NextRequest, NextResponse } from 'next/server';
import jwt from "jsonwebtoken";
import { prisma } from '~/lib/prisma';
import { verifyGoogleToken } from '~/lib/google-auth';
import { z } from "zod";

// Validation schema for Google auth
const googleAuthSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

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
    const validatedData = googleAuthSchema.parse(body);
    const { idToken } = validatedData;

    // Verify Google token
    const verifiedUser = await verifyGoogleToken(idToken);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: verifiedUser.id },
          { email: verifiedUser.email }
        ]
      }
    });

    let user;
    let isNewUser = false;

    if (existingUser) {
      // User exists, sign them in
      user = existingUser;
      
      // Update OAuth flag if not already set
      if (!user.isAlreadyRegisteredIn0auth) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isAlreadyRegisteredIn0auth: true }
        });
      }
    } else {
      // User doesn't exist, create new account
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          username: verifiedUser.email?.split('@')[0] || `user_${Date.now()}`,
          name: verifiedUser.name,
          email: verifiedUser.email,
          googleId: verifiedUser.id,
          image: verifiedUser.picture,
          DateOfBirth: '1990-01-01', // Default date as string, user can update later
          status: 'PENDING',
          isAlreadyRegisteredIn0auth: true,
        }
      });
    }

    // Generate JWT token
    const accessToken = generateAccessToken(user.id, user.username);

    return NextResponse.json({
      message: isNewUser ? 'Account created successfully' : 'Sign in successful',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        middleName: user.middleName,
        lastName: user.lastName,
        image: user.image,
        email: user.email,
        DateOfBirth: user.DateOfBirth,
        age: user.age,
        address: user.address,
        contactNumber: user.contactNumber,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    });

  } catch (error) {
    console.error('Google auth error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}