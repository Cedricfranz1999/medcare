import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";

// Validation schema for query parameters
const querySchema = z.object({
  page: z.number().min(1).default(1), // Page number for pagination
  limit: z.number().min(1).max(100).default(20), // Items per page
  inStock: z.boolean().optional(), // Filter by stock availability
  type: z.enum(["OTC", "PRESCRIPTION"]).optional(), // Filter by medicine type
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const params = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      inStock: searchParams.get("inStock") ? searchParams.get("inStock") === "true" : undefined,
      type: searchParams.get("type") as "OTC" | "PRESCRIPTION" | undefined,
    };
    
    const validatedParams = querySchema.parse(params);
    
    // Build where conditions
    const whereConditions: any = {
      recommended: true, // Only get recommended medicines
    };
    
    // Filter by stock availability if specified
    if (validatedParams.inStock !== undefined) {
      if (validatedParams.inStock) {
        whereConditions.stock = { gt: 0 };
      } else {
        whereConditions.stock = { lte: 0 };
      }
    }
    
    // Filter by type if specified
    if (validatedParams.type) {
      whereConditions.type = validatedParams.type;
    }
    
    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    
    // Execute query
    const [medicines, totalCount] = await Promise.all([
      prisma.medicine.findMany({
        where: whereConditions,
        orderBy: [
          { name: "asc" }, // Alphabetically by name
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
      filters: {
        recommended: true,
        inStock: validatedParams.inStock,
      }
    });
    
  } catch (error) {
    console.error("Recommended medicines error:", error);
    
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
      { error: "Failed to fetch recommended medicines" },
      { status: 500 }
    );
  }
}
