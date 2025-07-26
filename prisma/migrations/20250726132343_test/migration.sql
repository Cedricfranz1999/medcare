-- CreateEnum
CREATE TYPE "MedicineType" AS ENUM ('OTC', 'PRESCRIPTION');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('REQUESTED', 'GIVEN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DosageForm" AS ENUM ('TABLET', 'SYRUP', 'CAPSULE', 'INJECTION', 'CREAM', 'DROPS');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'DEACTIVE');

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'ADMIN',
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT,
    "image" TEXT,
    "DateOfBirth" TEXT NOT NULL,
    "age" TEXT,
    "address" TEXT,
    "contactNumber" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAlreadyRegisteredIn0auth" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" SERIAL NOT NULL,
    "image" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "description" TEXT,
    "type" "MedicineType" NOT NULL,
    "dosageForm" "DosageForm" NOT NULL,
    "size" TEXT,
    "stock" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MedicineCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineCategoryOnMedicine" (
    "medicineId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicineCategoryOnMedicine_pkey" PRIMARY KEY ("medicineId","categoryId")
);

-- CreateTable
CREATE TABLE "MedicineCart" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineRequestor" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "givenAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicineRequestor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");

-- CreateIndex
CREATE INDEX "Medicine_name_idx" ON "Medicine"("name");

-- CreateIndex
CREATE INDEX "Medicine_brand_idx" ON "Medicine"("brand");

-- CreateIndex
CREATE INDEX "Medicine_type_idx" ON "Medicine"("type");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineCategory_name_key" ON "MedicineCategory"("name");

-- CreateIndex
CREATE INDEX "MedicineCart_userId_idx" ON "MedicineCart"("userId");

-- CreateIndex
CREATE INDEX "MedicineCart_medicineId_idx" ON "MedicineCart"("medicineId");

-- CreateIndex
CREATE INDEX "MedicineRequestor_userId_idx" ON "MedicineRequestor"("userId");

-- CreateIndex
CREATE INDEX "MedicineRequestor_medicineId_idx" ON "MedicineRequestor"("medicineId");

-- CreateIndex
CREATE INDEX "MedicineRequestor_status_idx" ON "MedicineRequestor"("status");

-- AddForeignKey
ALTER TABLE "MedicineCategoryOnMedicine" ADD CONSTRAINT "MedicineCategoryOnMedicine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineCategoryOnMedicine" ADD CONSTRAINT "MedicineCategoryOnMedicine_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MedicineCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineCart" ADD CONSTRAINT "MedicineCart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineCart" ADD CONSTRAINT "MedicineCart_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineRequestor" ADD CONSTRAINT "MedicineRequestor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineRequestor" ADD CONSTRAINT "MedicineRequestor_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
