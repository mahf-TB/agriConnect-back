-- AlterTable
ALTER TABLE `Commande` MODIFY `statut` ENUM('en_attente', 'ouverte', 'partiellement_fournie', 'complete', 'acceptee', 'payee', 'livree', 'annulee') NOT NULL DEFAULT 'ouverte';

-- AlterTable
ALTER TABLE `Produit` MODIFY `statut` ENUM('disponible', 'indisponible', 'rupture', 'archive') NOT NULL DEFAULT 'disponible';
