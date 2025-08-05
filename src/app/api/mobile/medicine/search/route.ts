import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";

// Validation schema for search parameters
const searchSchema = z.object({
  query: z.string().optional(), // General search query
  name: z.string().optional(), // Search by medicine name
  brand: z.string().optional(), // Search by brand name
  page: z.number().min(1).default(1), // Page number for pagination
  limit: z.number().min(1).max(100).default(20), // Items per page
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate search parameters
    const params = {
      query: searchParams.get("query") || undefined,
      name: searchParams.get("name") || undefined,
      brand: searchParams.get("brand") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };
    
    const validatedParams = searchSchema.parse(params);
    
    // Build search conditions
    const whereConditions: any = {};
    
    // General search query (searches name, brand, and description)
    if (validatedParams.query) {
      whereConditions.OR = [
        { name: { contains: validatedParams.query, mode: "insensitive" } },
        { brand: { contains: validatedParams.query, mode: "insensitive" } },
      ];
    }
    
    // Specific field searches
    if (validatedParams.name) {
      whereConditions.name = { contains: validatedParams.name, mode: "insensitive" };
    }
    
    if (validatedParams.brand) {
      whereConditions.brand = { contains: validatedParams.brand, mode: "insensitive" };
    }
    
    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    
    // Execute search query
    const [medicines, totalCount] = await Promise.all([
      prisma.medicine.findMany({
        where: whereConditions,
        orderBy: [
          { recommended: "desc" }, // Recommended medicines first
          { name: "asc" }, // Then alphabetically by name
        ],
        skip,
        take: validatedParams.limit,
      }),
      prisma.medicine.count({
        where: whereConditions,
      })
    ]);
    
    // Transform the response
    const transformedMedicines = medicines.map(medicine => ({
      id: medicine.id,
      name: medicine.name,
      brand: medicine.brand,
      description: medicine.description,
      type: medicine.type,
      dosageForm: medicine.dosageForm,
      size: medicine.size,
      stock: medicine.stock,
      recommended: medicine.recommended,
      image: medicine.image,
      createdAt: medicine.createdAt,
      updatedAt: medicine.updatedAt,
    }));
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / validatedParams.limit);
    const hasNextPage = validatedParams.page < totalPages;
    const hasPreviousPage = validatedParams.page > 1;
    
    return NextResponse.json({
      medicines: transformedMedicines,
      pagination: {
        currentPage: validatedParams.page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit: validatedParams.limit,
      },
      searchParams: validatedParams,
    });
    
  } catch (error) {
    console.error("Medicine search error:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Invalid search parameters", 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: "Failed to search medicines" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
