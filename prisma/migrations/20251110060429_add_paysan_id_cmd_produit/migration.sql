/*
  Warnings:

  - Added the required column `paysanId` to the `CommandeProduit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CommandeProduit` ADD COLUMN `paysanId` VARCHAR(191) NOT NULL;
