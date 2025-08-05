/*
  Warnings:

  - You are about to drop the column `medicineId` on the `MedicineRequestor` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `MedicineRequestor` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MedicineCart" DROP CONSTRAINT "MedicineCart_medicineId_fkey";

-- DropForeignKey
ALTER TABLE "MedicineCategoryOnMedicine" DROP CONSTRAINT "MedicineCategoryOnMedicine_medicineId_fkey";

-- DropForeignKey
ALTER TABLE "MedicineRequestor" DROP CONSTRAINT "MedicineRequestor_medicineId_fkey";

-- DropIndex
DROP INDEX "MedicineRequestor_medicineId_idx";

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "recommended" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MedicineCategory" ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "MedicineRequestor" DROP COLUMN "medicineId",
DROP COLUMN "quantity";

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "password" DROP DEFAULT,
ALTER COLUMN "password" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "MedicineRequestItem" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "MedicineRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicineRequestItem_requestId_idx" ON "MedicineRequestItem"("requestId");

-- CreateIndex
CREATE INDEX "MedicineRequestItem_medicineId_idx" ON "MedicineRequestItem"("medicineId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineRequestItem_requestId_medicineId_key" ON "MedicineRequestItem"("requestId", "medicineId");

-- AddForeignKey
ALTER TABLE "MedicineCategoryOnMedicine" ADD CONSTRAINT "MedicineCategoryOnMedicine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineCart" ADD CONSTRAINT "MedicineCart_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineRequestItem" ADD CONSTRAINT "MedicineRequestItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineRequestItem" ADD CONSTRAINT "MedicineRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MedicineRequestor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
