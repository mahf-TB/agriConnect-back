-- CreateTable
CREATE TABLE `Commande` (
    `id` VARCHAR(191) NOT NULL,
    `produitRecherche` VARCHAR(191) NOT NULL,
    `quantiteTotal` DECIMAL(10, 2) NOT NULL,
    `prixUnitaire` DECIMAL(10, 2) NOT NULL,
    `territoire` VARCHAR(191) NULL,
    `statut` ENUM('en_attente', 'ouverte', 'partiellement_fournie', 'complete', 'acceptee', 'annulee') NOT NULL DEFAULT 'ouverte',
    `messageCollecteur` VARCHAR(191) NULL,
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

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
