import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get all categories
    const categories = await prisma.medicineCategory.findMany({
      orderBy: {
        name: "asc"
      }
    });

    // Get medicine counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const medicineCount = await prisma.medicineCategoryOnMedicine.count({
          where: {
            categoryId: category.id
          }
        });

        return {
          id: category.id,
          name: category.name,
          medicineCount,
          createdAt: category.createdAt
        };
      })
    );

    return NextResponse.json({
      categories: categoriesWithCounts,
      totalCategories: categories.length
    });

  } catch (error) {
    console.error("Medicine categories error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch medicine categories" },
      { status: 500 }
    );
  }
}
