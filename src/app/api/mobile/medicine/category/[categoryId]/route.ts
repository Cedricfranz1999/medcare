import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";
import { z } from "zod";

// Validation schema for query parameters
const querySchema = z.object({
  page: z.number().min(1).default(1), // Page number for pagination
  limit: z.number().min(1).max(100).default(20), // Items per page
  inStock: z.boolean().optional(), // Filter by stock availability
  recommended: z.boolean().optional(), // Filter by recommended status
  type: z.enum(["OTC", "PRESCRIPTION"]).optional(), // Filter by medicine type
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);

    const resolvedParams = await params;
    const categoryId = parseInt(resolvedParams.categoryId);
    
    // Parse and validate category ID
    if (isNaN(categoryId) || categoryId < 1) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }
    
    // Parse and validate query parameters
    const queryParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      inStock: searchParams.get("inStock") ? searchParams.get("inStock") === "true" : undefined,
      recommended: searchParams.get("recommended") ? searchParams.get("recommended") === "true" : undefined,
      type: searchParams.get("type") || undefined,
    };
    
    const validatedParams = querySchema.parse(queryParams);
    
    // Check if category exists
    const category = await prisma.medicineCategory.findUnique({
      where: { id: categoryId },
    });
    
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    
    // Build where conditions for medicines
    const whereConditions: any = {
      categories: {
        some: {
          categoryId: categoryId,
        },
      },
    };
    
    // Apply additional filters
    if (validatedParams.inStock !== undefined) {
      if (validatedParams.inStock) {
        whereConditions.stock = { gt: 0 };
      } else {
        whereConditions.stock = { lte: 0 };
      }
    }
    
    if (validatedParams.recommended !== undefined) {
      whereConditions.recommended = validatedParams.recommended;
    }
    
    if (validatedParams.type) {
      whereConditions.type = validatedParams.type;
    }
    
    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    
    // Execute query
    const [medicines, totalCount] = await Promise.all([
      prisma.medicine.findMany({
        where: whereConditions,
        include: {
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
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
      categories: medicine.categories.map(cat => ({
        id: cat.category.id,
        name: cat.category.name,
      })),
      isAvailable: medicine.stock > 0,
    }));
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / validatedParams.limit);
    const hasNextPage = validatedParams.page < totalPages;
    const hasPreviousPage = validatedParams.page > 1;
    
    // Get category statistics
    const categoryStats = await Promise.all([
      prisma.medicine.count({
        where: {
          categories: {
            some: {
              categoryId: categoryId,
            },
          },
          stock: { gt: 0 },
        },
      }),
      prisma.medicine.count({
        where: {
          categories: {
            some: {
              categoryId: categoryId,
            },
          },
          recommended: true,
        },
      }),
    ]);
    
    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        createdAt: category.createdAt,
      },
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
        inStock: validatedParams.inStock,
        recommended: validatedParams.recommended,
        type: validatedParams.type,
      },
      statistics: {
        totalMedicines: totalCount,
        availableMedicines: categoryStats[0],
        recommendedMedicines: categoryStats[1],
      }
    });
    
  } catch (error) {
    console.error("Medicines by category error:", error);
    
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
      { error: "Failed to fetch medicines by category" },
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