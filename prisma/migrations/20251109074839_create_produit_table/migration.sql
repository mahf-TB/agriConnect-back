-- CreateTable
CREATE TABLE `Produit` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(150) NOT NULL,
    `type` ENUM('grain', 'legumineuse', 'tubercule', 'fruit', 'legume', 'epice', 'autre') NOT NULL,
    `sousType` VARCHAR(100) NULL,
    `description` VARCHAR(191) NULL,
    `quantiteDisponible` DECIMAL(10, 2) NOT NULL,
    `unite` ENUM('kg', 'tonne', 'sac', 'litre') NOT NULL DEFAULT 'kg',
    `prixUnitaire` DECIMAL(10, 2) NOT NULL,
    `dateRecolte` DATETIME(3) NOT NULL,
    `datePeremption` DATETIME(3) NULL,
    `imageUrl` VARCHAR(255) NULL,
    `statut` ENUM('disponible', 'rupture', 'archive') NOT NULL DEFAULT 'disponible',
    `conditionsStockage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `paysanId` VARCHAR(191) NOT NULL,

    INDEX `Produit_paysanId_idx`(`paysanId`),
    INDEX `Produit_type_idx`(`type`),
    INDEX `Produit_statut_idx`(`statut`),
    INDEX `Produit_dateRecolte_idx`(`dateRecolte`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
