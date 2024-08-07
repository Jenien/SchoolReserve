/*
  Warnings:

  - A unique constraint covering the columns `[itemCode]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemCode` to the `Inventory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "category" TEXT,
ADD COLUMN     "itemCode" TEXT NOT NULL,
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "purchasePrice" DOUBLE PRECISION,
ADD COLUMN     "supplier" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_itemCode_key" ON "Inventory"("itemCode");
