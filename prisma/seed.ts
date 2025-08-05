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
  return values[randomIndex]!;
};

interface UserData {
  username: string;
  password: string;
  name: string;
  middleName: string | null;
  lastName: string | null;
  DateOfBirth: string;
  age: string | null;
  address: string | null;
  contactNumber: string | null;
  status: UserStatus;
  isAlreadyRegisteredIn0auth: boolean;
}

const generateUsers = (count: number): UserData[] => {
  return Array.from({ length: count }, (): UserData => {
    const birthDate = faker.date.birthdate({ min: 18, max: 80, mode: "age" });
    const dateString = birthDate.toISOString().split("T")[0]!;
    const age = faker.number.int({ min: 18, max: 80 }).toString();

    return {
      username: faker.internet.userName().toLowerCase().replace(/\s/g, "_"),
      password: faker.internet.password(),
      name: faker.person.firstName(),
      middleName: faker.datatype.boolean() ? faker.person.middleName() : null,
      lastName: faker.datatype.boolean() ? faker.person.lastName() : null,
      DateOfBirth: dateString,
      age: faker.datatype.boolean() ? age : null,
      address: faker.datatype.boolean() ? faker.location.streetAddress() : null,
      contactNumber: faker.datatype.boolean() ? faker.phone.number() : null,
      status: randomEnumValue(UserStatus),
      isAlreadyRegisteredIn0auth: faker.datatype.boolean(),
    };
  });
};

interface MedicineData {
  name: string;
  brand: string;
  description: string | null;
  type: MedicineType;
  dosageForm: DosageForm;
  size: string | null;
  stock: number;
  recommended: boolean;
  expiryDate: Date | null;
}

const generateMedicines = (count: number): MedicineData[] => {
  return Array.from(
    { length: count },
    (): MedicineData => ({
      name: faker.commerce.productName(),
      brand: faker.company.name(),
      description: faker.datatype.boolean()
        ? faker.commerce.productDescription()
        : null,
      type: randomEnumValue(MedicineType),
      dosageForm: randomEnumValue(DosageForm),
      size: faker.datatype.boolean()
        ? `${faker.number.int({ min: 1, max: 100 })}${faker.helpers.arrayElement(["mg", "ml", "g"])}`
        : null,
      stock: faker.number.int({ min: 10, max: 500 }),
      recommended: faker.datatype.boolean(),
      expiryDate: faker.datatype.boolean()
        ? faker.date.future({ years: 2 })
        : null,
    }),
  );
};

interface MedicineRequestorData {
  userId: number;
  reason: string;
  status: RequestStatus;
  requestedAt: Date;
  approvedAt: Date | null;
  givenAt: Date | null;
  cancelledReason: string | null;
}

const generateMedicineRequests = (
  userId: number,
  count: number,
): MedicineRequestorData[] => {
  return Array.from({ length: count }, (): MedicineRequestorData => {
    const status = randomEnumValue(RequestStatus);
    const requestedAt = faker.date.recent({ days: 30 });

    return {
      userId,
      reason: faker.lorem.sentence(),
      status,
      requestedAt,
      approvedAt:
        status === "GIVEN"
          ? faker.date.between({ from: requestedAt, to: new Date() })
          : null,
      givenAt:
        status === "GIVEN"
          ? faker.date.between({ from: requestedAt, to: new Date() })
          : null,
      cancelledReason: status === "CANCELLED" ? faker.lorem.sentence() : null,
    };
  });
};

async function main() {
  console.log("🌱 Starting seeding...");

  // Clear existing data
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
        addedAt: faker.date.recent({ days: 30 }),
      })),
    });
  }
  console.log(`✅ Created carts for all users`);

  // Seed Medicine Requests (2-4 requests per user)
  for (const user of allUsers) {
    const numRequests = faker.number.int({ min: 1, max: 4 });
    const requests = generateMedicineRequests(user.id, numRequests);

    for (const request of requests) {
      const numRequestItems = faker.number.int({ min: 1, max: 5 });
      const selectedMedicines = faker.helpers.arrayElements(
        allMedicines,
        numRequestItems,
      );

      await prisma.medicineRequestor.create({
        data: {
          ...request,
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

  // Create an admin user
  await prisma.admin.create({
    data: {
      name: "ADMIN",
      username: "admin",
      password: "admin123", // In a real app, this should be hashed
    },
  });
  console.log(`✅ Created admin user`);

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
