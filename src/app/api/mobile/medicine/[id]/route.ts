import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const medicineId = parseInt(params.id);

    if (isNaN(medicineId)) {
      return NextResponse.json(
        { error: "Invalid medicine ID" },
        { status: 400 }
      );
    }

    // Get medicine with categories
    const medicine = await prisma.medicine.findUnique({
      where: {
        id: medicineId
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

    if (!medicine) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    // Transform the data to include category names
    const medicineWithCategories = {
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
    };

    return NextResponse.json({
      medicine: medicineWithCategories
    });

  } catch (error) {
    console.error("Medicine details error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch medicine details" },
      { status: 500 }
    );
  }
} 