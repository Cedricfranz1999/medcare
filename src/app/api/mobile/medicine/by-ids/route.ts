import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: "IDs parameter is required" },
        { status: 400 }
      );
    }

    // Parse IDs from query parameter - support comma-separated IDs
    const medicineIds = idsParam
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    if (medicineIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid medicine ID(s)" },
        { status: 400 }
      );
    }

    // Get medicines with categories
    const medicines = await prisma.medicine.findMany({
      where: {
        id: {
          in: medicineIds
        }
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (medicines.length === 0) {
      return NextResponse.json(
        { error: "No medicines found" },
        { status: 404 }
      );
    }

    // Transform the data to include category names for each medicine
    const medicinesWithCategories = medicines.map(medicine => ({
      id: medicine.id,
      name: medicine.name,
      brand: medicine.brand,
      description: medicine.description,
      type: medicine.type,
      dosageForm: medicine.dosageForm,
      size: medicine.size,
      stock: medicine.stock,
      image: medicine.image,
      recommended: medicine.recommended,
      expiryDate: medicine.expiryDate,
      createdAt: medicine.createdAt,
      updatedAt: medicine.updatedAt,
      categories: medicine.categories.map(cat => ({
        id: cat.category.id,
        name: cat.category.name
      }))
    }));

    return NextResponse.json({
      medicines: medicinesWithCategories,
      count: medicinesWithCategories.length
    });

  } catch (error) {
    console.error("Medicines by IDs error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}
