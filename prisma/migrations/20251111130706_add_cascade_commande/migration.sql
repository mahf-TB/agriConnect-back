-- AlterTable
ALTER TABLE `CommandeProduit` MODIFY `statutLigne` ENUM('en_attente', 'acceptee', 'partiellement_acceptee', 'rejetée') NOT NULL DEFAULT 'en_attente';
