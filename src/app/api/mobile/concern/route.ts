import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// POST /api/mobile/concern - Create a new user concern
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subject, description } = body;

    // Validate required fields
    if (!userId || !subject || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, subject, and description are required' },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (subject.length > 200) {
      return NextResponse.json(
        { error: 'Subject must be 200 characters or less' },
        { status: 400 }
      );
    }

    if (description.length > 1000) {
      return NextResponse.json(
        { error: 'Description must be 1000 characters or less' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the concern
    const concern = await prisma.userConcern.create({
      data: {
        userId: parseInt(userId),
        subject: subject.trim(),
        description: description.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(
      {
        message: 'Concern created successfully',
        concern: {
          id: concern.id,
          userId: concern.userId,
          subject: concern.subject,
          description: concern.description,
          status: concern.status,
          createdAt: concern.createdAt,
          user: concern.user
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating concern:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/mobile/concern - Get user concerns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ['PENDING', 'IN_REVIEW', 'RESOLVED', 'CLOSED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: PENDING, IN_REVIEW, RESOLVED, CLOSED' },
        { status: 400 }
      );
    }

    let whereClause: any = {};
    
    // Build where clause based on filters
    if (userId || status) {
      whereClause = {};
      if (userId) {
        whereClause.userId = parseInt(userId);
      }
      if (status) {
        whereClause.status = status;
      }
    }

    // Get concerns with pagination
    const [concerns, totalCount] = await Promise.all([
      prisma.userConcern.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.userConcern.count({
        where: whereClause,
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      concerns: concerns.map((concern: any) => ({
        id: concern.id,
        userId: concern.userId,
        subject: concern.subject,
        description: concern.description,
        status: concern.status,
        createdAt: concern.createdAt,
        updatedAt: concern.updatedAt,
        user: concern.user
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    });

  } catch (error) {
    console.error('Error fetching concerns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
