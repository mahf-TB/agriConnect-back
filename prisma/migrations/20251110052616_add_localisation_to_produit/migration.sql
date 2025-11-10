-- AlterTable
ALTER TABLE `Produit` ADD COLUMN `latitude` DECIMAL(10, 8) NULL,
    ADD COLUMN `localisation` VARCHAR(100) NULL,
    ADD COLUMN `longitude` DECIMAL(11, 8) NULL;
