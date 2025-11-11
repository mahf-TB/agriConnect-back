-- AlterTable
ALTER TABLE `Commande` ADD COLUMN `adresseLiviraison` TEXT NULL,
    ADD COLUMN `dateLivraison` DATETIME(3) NULL,
    ADD COLUMN `dateLivraisonPrevue` DATETIME(3) NULL,
    MODIFY `statut` ENUM('en_attente', 'ouverte', 'partiellement_fournie', 'complete', 'acceptee', 'livree', 'annulee') NOT NULL DEFAULT 'ouverte';

-- AlterTable
ALTER TABLE `CommandeProduit` MODIFY `prixUnitaire` DECIMAL(10, 2) NULL;
