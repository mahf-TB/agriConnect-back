-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `expediteurId` VARCHAR(191) NOT NULL,
    `destinataireId` VARCHAR(191) NOT NULL,
    `contenu` VARCHAR(191) NULL,
    `typeContenu` ENUM('texte', 'image', 'video', 'document') NOT NULL DEFAULT 'texte',
    `fichierUrl` VARCHAR(191) NULL,
    `lu` BOOLEAN NOT NULL DEFAULT false,
    `dateEnvoi` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateLecture` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `conversationId` VARCHAR(191) NULL,

    INDEX `Message_expediteurId_destinataireId_idx`(`expediteurId`, `destinataireId`),
    INDEX `Message_dateEnvoi_idx`(`dateEnvoi`),
    INDEX `Message_lu_idx`(`lu`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` VARCHAR(191) NOT NULL,
    `participant1Id` VARCHAR(191) NOT NULL,
    `participant2Id` VARCHAR(191) NOT NULL,
    `dernierMessageId` VARCHAR(191) NULL,
    `messagesNonLusP1` INTEGER NOT NULL DEFAULT 0,
    `messagesNonLusP2` INTEGER NOT NULL DEFAULT 0,
    `dateDerniereActivite` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `archiveP1` BOOLEAN NOT NULL DEFAULT false,
    `archiveP2` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Conversation_dernierMessageId_key`(`dernierMessageId`),
    INDEX `Conversation_participant1Id_participant2Id_idx`(`participant1Id`, `participant2Id`),
    UNIQUE INDEX `Conversation_participant1Id_participant2Id_key`(`participant1Id`, `participant2Id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
