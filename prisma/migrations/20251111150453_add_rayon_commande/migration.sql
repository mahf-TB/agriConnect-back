-- AlterTable
ALTER TABLE `Commande` ADD COLUMN `rayon` DOUBLE NULL,
    ADD COLUMN `unite` ENUM('kg', 'tonne', 'sac', 'litre') NOT NULL DEFAULT 'kg';
