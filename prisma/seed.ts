import {
  PrismaClient,
  MedicineType,
  RequestStatus,
  DosageForm,
  UserStatus,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// Helper functions with proper typing
const randomEnumValue = <T extends Record<string, string>>(
  enumObj: T,
): T[keyof T] => {
  const values = Object.values(enumObj) as T[keyof T][];
  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex]!; // Non-null assertion since we know index is valid
};

interface UserData {
  username: string;
  password: Date;
  name: string;
  lastName: string;
  DateOfBirth: string;
  status: UserStatus;
  address: string;
  contactNumber: string;
}

const generateUsers = (count: number): UserData[] => {
  return Array.from({ length: count }, (): UserData => {
    const birthDate = faker.date.birthdate({ min: 18, max: 80, mode: "age" });
    const dateString = birthDate.toISOString().split("T")[0];

    if (!dateString) {
      throw new Error("Failed to generate birth date");
    }

    return {
      username: faker.internet.userName().toLowerCase().replace(/\s/g, "_"),
      password: new Date(),
      name: faker.person.firstName(),
      lastName: faker.person.lastName(),
      DateOfBirth: dateString,
      status: randomEnumValue(UserStatus),
      address: faker.location.streetAddress(),
      contactNumber: faker.phone.number(),
    };
  });
};
interface MedicineData {
  name: string;
  brand: string;
  type: MedicineType;
  dosageForm: DosageForm;
  stock: number;
  description: string;
  expiryDate: Date;
  recommended: boolean;
}

const generateMedicines = (count: number): MedicineData[] => {
  return Array.from(
    { length: count },
    (): MedicineData => ({
      name: faker.commerce.productName(),
      brand: faker.company.name(),
      type: randomEnumValue(MedicineType),
      dosageForm: randomEnumValue(DosageForm),
      stock: faker.number.int({ min: 10, max: 500 }),
      description: faker.commerce.productDescription(),
      expiryDate: faker.date.future({ years: 2 }),
      recommended: faker.datatype.boolean(),
    }),
  );
};

async function main() {
  console.log("🌱 Starting seeding...");

  // Clear existing data (optional - be careful in production!)
  await prisma.medicineRequestItem.deleteMany();
  await prisma.medicineRequestor.deleteMany();
  await prisma.medicineCart.deleteMany();
  await prisma.medicineCategoryOnMedicine.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.user.deleteMany();
  await prisma.medicineCategory.deleteMany();

  // Seed Medicine Categories
  const categories = [
    "Pain Relief",
    "Antibiotics",
    "Antihistamines",
    "Vitamins",
    "Digestive Health",
    "Cough and Cold",
    "Allergy Relief",
    "Heart Health",
    "Skin Care",
    "Eye Care",
    "Diabetes Management",
    "First Aid",
    "Mental Health",
    "Women's Health",
    "Men's Health",
    "Sleep Aids",
    "Immune Support",
    "Anti-inflammatory",
    "Respiratory Health",
    "Bone and Joint Health",
  ];

  await prisma.medicineCategory.createMany({
    data: categories.map((name) => ({ name })),
  });

  // Seed Users (10 users)
  const users = await prisma.user.createMany({
    data: generateUsers(10),
  });
  console.log(`✅ Created ${users.count} users`);

  // Seed Medicines (20 medicines)
  const medicines = await prisma.medicine.createMany({
    data: generateMedicines(20),
  });
  console.log(`✅ Created ${medicines.count} medicines`);

  // Associate medicines with random categories
  const allMedicines = await prisma.medicine.findMany();
  const allCategories = await prisma.medicineCategory.findMany();

  for (const medicine of allMedicines) {
    const numCategories = faker.number.int({ min: 1, max: 3 });
    const selectedCategories = faker.helpers.arrayElements(
      allCategories,
      numCategories,
    );

    await prisma.medicineCategoryOnMedicine.createMany({
      data: selectedCategories.map((category) => ({
        medicineId: medicine.id,
        categoryId: category.id,
      })),
    });
  }
  console.log(`✅ Associated medicines with categories`);

  // Seed Medicine Carts (3-5 items per user)
  const allUsers = await prisma.user.findMany();

  for (const user of allUsers) {
    const numCartItems = faker.number.int({ min: 1, max: 5 });
    const selectedMedicines = faker.helpers.arrayElements(
      allMedicines,
      numCartItems,
    );

    await prisma.medicineCart.createMany({
      data: selectedMedicines.map((medicine) => ({
        userId: user.id,
        medicineId: medicine.id,
        quantity: faker.number.int({ min: 1, max: 3 }),
      })),
    });
  }
  console.log(`✅ Created carts for all users`);

  // Seed Medicine Requests (2-4 requests per user)
  for (const user of allUsers) {
    const numRequests = faker.number.int({ min: 1, max: 4 });

    for (let i = 0; i < numRequests; i++) {
      const numRequestItems = faker.number.int({ min: 1, max: 5 });
      const selectedMedicines = faker.helpers.arrayElements(
        allMedicines,
        numRequestItems,
      );

      await prisma.medicineRequestor.create({
        data: {
          userId: user.id,
          reason: faker.lorem.sentence(),
          status: randomEnumValue(RequestStatus),
          medicines: {
            create: selectedMedicines.map((medicine) => ({
              medicineId: medicine.id,
              quantity: faker.number.int({ min: 1, max: 3 }),
            })),
          },
        },
      });
    }
  }
  console.log(`✅ Created medicine requests for all users`);

  console.log("🌱 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
