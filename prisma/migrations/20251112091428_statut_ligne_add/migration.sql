-- AlterTable
ALTER TABLE `CommandeProduit` MODIFY `statutLigne` ENUM('en_attente', 'acceptee', 'partiellement_acceptee', 'livree', 'rejetée') NOT NULL DEFAULT 'en_attente';

-- CreateIndex
CREATE INDEX `Commande_collecteurId_idx` ON `Commande`(`collecteurId`);

-- CreateIndex
CREATE INDEX `Commande_statut_idx` ON `Commande`(`statut`);

-- CreateIndex
CREATE INDEX `CommandeProduit_produitId_idx` ON `CommandeProduit`(`produitId`);

-- CreateIndex
CREATE INDEX `CommandeProduit_paysanId_idx` ON `CommandeProduit`(`paysanId`);
