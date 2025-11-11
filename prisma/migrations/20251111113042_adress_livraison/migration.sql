/*
  Warnings:

  - You are about to drop the column `adresseLiviraison` on the `Commande` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Commande` DROP COLUMN `adresseLiviraison`,
    ADD COLUMN `adresseLivraison` TEXT NULL,
    MODIFY `quantiteTotal` DECIMAL(10, 2) NULL,
    MODIFY `prixUnitaire` DECIMAL(10, 2) NULL;
