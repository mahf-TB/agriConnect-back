-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telephone` VARCHAR(191) NOT NULL,
    `mot_de_passe` VARCHAR(191) NOT NULL,
    `role` ENUM('paysan', 'collecteur', 'admin') NOT NULL,
    `avatar` VARCHAR(255) NULL,
    `adresse` TEXT NULL,
    `localisation` VARCHAR(100) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `statut` ENUM('actif', 'inactif', 'suspendu') NOT NULL DEFAULT 'actif',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_localisation_idx`(`localisation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Produit` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(150) NOT NULL,
    `type` ENUM('grain', 'legumineuse', 'tubercule', 'fruit', 'legume', 'epice', 'autre') NOT NULL,
    `sousType` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `quantiteDisponible` DECIMAL(10, 2) NOT NULL,
    `unite` ENUM('kg', 'tonne', 'sac', 'litre') NOT NULL DEFAULT 'kg',
    `prixUnitaire` DECIMAL(10, 2) NOT NULL,
    `dateRecolte` DATETIME(3) NOT NULL,
    `datePeremption` DATETIME(3) NULL,
    `imageUrl` VARCHAR(255) NULL,
    `statut` ENUM('disponible', 'rupture', 'archive') NOT NULL DEFAULT 'disponible',
    `conditionsStockage` TEXT NULL,
    `localisation` VARCHAR(100) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `paysanId` VARCHAR(191) NOT NULL,

    INDEX `Produit_paysanId_idx`(`paysanId`),
    INDEX `Produit_type_idx`(`type`),
    INDEX `Produit_statut_idx`(`statut`),
    INDEX `Produit_dateRecolte_idx`(`dateRecolte`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commande` (
    `id` VARCHAR(191) NOT NULL,
    `produitRecherche` VARCHAR(191) NOT NULL,
    `quantiteTotal` DECIMAL(10, 2) NOT NULL,
    `prixUnitaire` DECIMAL(10, 2) NOT NULL,
    `statut` ENUM('en_attente', 'ouverte', 'partiellement_fournie', 'complete', 'acceptee', 'annulee') NOT NULL DEFAULT 'ouverte',
    `messageCollecteur` TEXT NULL,
    `territoire` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `collecteurId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommandeProduit` (
    `id` VARCHAR(191) NOT NULL,
    `quantiteAccordee` DECIMAL(10, 2) NOT NULL,
    `prixUnitaire` DECIMAL(10, 2) NOT NULL,
    `statutLigne` ENUM('acceptee', 'partiellement_acceptee', 'rejetée') NOT NULL DEFAULT 'acceptee',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `commandeId` VARCHAR(191) NOT NULL,
    `produitId` VARCHAR(191) NOT NULL,
    `paysanId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
