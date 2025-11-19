import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePropositionDto } from './dto/create-proposition.dto';
import { NotificationType } from 'generated/enums';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import {
  paginate,
  PaginatedResult,
  PaginationOptions,
} from 'src/common/utils/pagination';

@Injectable()
export class CmdProduitsService {
  private readonly logger = new Logger(CmdProduitsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifyService: NotificationsService,
  ) {}

 
  async getCommandesReciviedByPaysan(
    paysanId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<any>> {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;

    // Vérifier si le paysan existe
    const paysanExists = await this.prisma.user.findUnique({
      where: { id: paysanId },
      select: { id: true },
    });

    if (!paysanExists) {
      throw new NotFoundException(`Paysan avec l'id ${paysanId} introuvable`);
    }

    // Calcul du skip
    const skip = (page - 1) * limit;

    // Récupérer le total
    const total = await this.prisma.commandeProduit.count({
      where: { paysanId },
    });

    // Récupérer les données paginées
    const commandes = await this.prisma.commandeProduit.findMany({
      where: {
        paysanId,
      },
      include: {
        produit: true,
        commande: {
          select: {
            id: true,
            produitRecherche: true,
            territoire: false,
            quantiteTotal: true,
            prixUnitaire: true,
            statut: true,
            adresseLivraison: true,
            dateLivraisonPrevue: true,
            messageCollecteur: true,
            createdAt: true,
            collecteur: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                telephone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Utilisation de ton helper paginate()
    return paginate(commandes, total, { page, limit });
  }

  async proposerProduit(
    commandeId: string,
    dto: CreatePropositionDto & { paysanId: string },
  ) {
    try {
      // 1️⃣ Vérifier si la commande existe
      const commande = await this.prisma.commande.findUnique({
        where: { id: commandeId },
        include: { lignes: true },
      });
      if (!commande) throw new NotFoundException('Commande non trouvée');
      // 2️⃣ Calculer la quantité totale déjà proposée
      const quantiteExistante = commande.lignes.reduce(
        (total, ligne) => Number(total) + Number(ligne.quantiteAccordee),
        0,
      );
      // 3️⃣ Vérifier si la commande est déjà complète
      if (quantiteExistante >= Number(commande.quantiteTotal)) {
        throw new BadRequestException(
          `La commande est déjà complète (${quantiteExistante}/${commande.quantiteTotal} ${commande.unite})`,
        );
      }

      return this.prisma.$transaction(async (tx) => {
        // 5️⃣ Créer la nouvelle proposition
        const proposition = await tx.commandeProduit.create({
          data: {
            commandeId,
            paysanId: dto.paysanId,
            produitId: dto.produitId,
            quantiteAccordee: dto.quantite,
            prixUnitaire: dto.prixUnitaire ?? commande.prixUnitaire,
          },
          include: { produit: true, paysan: true },
        });
        // 6️⃣ Calculer la nouvelle somme totale
        const nouvelleQuantiteTotale = quantiteExistante + dto.quantite;
        // 7️⃣ Déterminer le nouveau statut
        let nouveauStatut = commande.statut;
        if (nouvelleQuantiteTotale >= Number(commande.quantiteTotal)) {
          nouveauStatut = 'complete'; // à adapter à ton enum CommandeStatut
        } else {
          nouveauStatut = 'partiellement_fournie';
        }
        // 8️⃣ Mettre à jour le statut de la commande
        await tx.commande.update({
          where: { id: commandeId },
          data: { statut: nouveauStatut },
        });

        await tx.produit.update({
          where: { id: dto.produitId },
          data: { quantiteDisponible: { decrement: dto.quantite } },
        });

        // Notifier le collecteur
        try {
          await this.notifyService.envoieNotifyOneUser({
            type: NotificationType.commande,
            titre: 'Proposition reçue',
            message: `Un paysan a proposé ${dto.quantite} ${commande.unite} pour votre demande de ${commande.produitRecherche}`,
            lien: `/orders/${commande.id}`,
            reference_id: proposition.produit.imageUrl,
            reference_type: 'commande',
            userId: commande.collecteurId,
          });
        } catch (notifyErr) {
          this.logger.warn(
            `Impossible d'envoyer notification au collecteur: ${notifyErr.message}`,
          );
        }

        // 9️⃣ Retourner le résultat
        return {
          message: 'Proposition enregistrée avec succès',
          commandeStatut: nouveauStatut,
          proposition,
        };
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Erreur lors de la création de la proposition : ' + error.message,
      );
    }
  }

  // ==================================================
  // Accepter une commande
  // ==================================================
  async accepterCommande(paysanId: string, commandeId: string) {
    // Récupérer la ligne de commande du paysan pour cette commande
    const ligne = await this.getCommandeProduitForPaysanCommande(
      paysanId,
      commandeId,
    );

    if (ligne.statutLigne === 'acceptee') {
      throw new BadRequestException('Cette ligne est déjà acceptée');
    }
    if (ligne.statutLigne === 'rejetée') {
      throw new BadRequestException('Cette ligne a déjà été refusée');
    }

    return this.updateLigneStatut(ligne.id, 'acceptee');
  }

  // ==================================================
  // Refuser une commande
  // ==================================================
  async refuserCommande(
    paysanId: string,
    commandeId: string,
    raison?: string,
  ) {
    const ligne = await this.getCommandeProduitForPaysanCommande(
      paysanId,
      commandeId,
    );

    if (ligne.statutLigne === 'rejetée') {
      throw new BadRequestException('Cette ligne a déjà été refusée');
    }

    return this.updateLigneStatut(ligne.id, 'rejetée', raison);
  }
  // ==================================================
  // Refuser une commande
  // ==================================================
  async livreeCommande(
    paysanId: string,
    commandeProduitId: string,
    raison?: string,
  ) {
    const ligne = await this.getCommandeProduitForPaysanCommande(
      paysanId,
      commandeProduitId,
    );

    if (ligne.statutLigne === 'livree') {
      throw new BadRequestException('Cette ligne est déjà livrée');
    }
    if (ligne.statutLigne === 'rejetée') {
      throw new BadRequestException('Cette ligne a déjà été refusée');
    }

    return this.updateLigneStatut(ligne.id, 'livree', raison);
  }

  // ==================================================
  // ------------------ Private ----------------------
  // ==================================================

  /**
   * Vérifie que la ligne existe et appartient bien au paysan
   * @param paysanId ID du paysan
   * @param commandeId ID de la commande
   * @returns Ligne de commande
   */
  private async getCommandeProduitForPaysanCommande(
    paysanId: string,
    commandeId: string,
  ) {
    const ligne = await this.prisma.commandeProduit.findFirst({
      where: {
        paysanId,
        commandeId,
      },
      include: { commande: true },
    });

    if (!ligne) {
      throw new NotFoundException(
        'Commande introuvable pour ce paysan ou non attribuée',
      );
    }

    return ligne;
  }

  /**
   * Met à jour le statut d'une ligne de commande
   * et éventuellement le statut global de la commande
   * @param commandeProduitId ID de la ligne de commande
   * @param statutLigne Nouveau statut de la ligne
   * @param raison Raison du refus (optionnel)
   */
  private async updateLigneStatut(
    commandeProduitId: string,
    statutLigne: 'acceptee' | 'partiellement_acceptee' | 'livree' | 'rejetée',
    raison?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ Mise à jour de la ligne
      const updatedLigne = await tx.commandeProduit.update({
        where: { id: commandeProduitId },
        data: {
          statutLigne,
        },
      });

      // 2️⃣ Vérifier si toutes les lignes ont été traitées
      const lignes = await tx.commandeProduit.findMany({
        where: { commandeId: updatedLigne.commandeId },
      });

      const allAccepted = lignes.every(
        (l) =>
          l.statutLigne === 'acceptee' ||
          l.statutLigne === 'partiellement_acceptee',
      );
      const allRefused = lignes.every((l) => l.statutLigne === 'rejetée');
      const allDelivred = lignes.every((l) => l.statutLigne === 'livree');

      // 3️⃣ Mettre à jour le statut global de la commande si nécessaire
      if (allAccepted) {
        await tx.commande.update({
          where: { id: updatedLigne.commandeId },
          data: { statut: 'acceptee' },
        });
      } else if (allRefused) {
        await tx.commande.update({
          where: { id: updatedLigne.commandeId },
          data: { statut: 'annulee' },
        });
      } else if (allDelivred) {
        await tx.commande.update({
          where: { id: updatedLigne.commandeId },
          data: { statut: 'livree' },
        });
      }

      return updatedLigne;
    });
  }
}
