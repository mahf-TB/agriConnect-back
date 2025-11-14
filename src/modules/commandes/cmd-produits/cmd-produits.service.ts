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

@Injectable()
export class CmdProduitsService {

   private readonly logger = new Logger(CmdProduitsService.name);

  constructor(private readonly prisma: PrismaService,
     private readonly notifyService: NotificationsService
  ) {}

  async getCommandesReciviedByPaysan(paysanId: string) {
    // Vérifier si le paysan existe
    const paysanExists = await this.prisma.user.findUnique({
      where: { id: paysanId },
      select: { id: true },
    });
    if (!paysanExists) {
      throw new NotFoundException(`Paysan avec l'id ${paysanId} introuvable`);
    }
    // Récupérer toutes les lignes de commande liées à ce paysan
    const commandes = await this.prisma.commandeProduit.findMany({
      where: {
        paysanId,
      },
      include: {
        produit: {
          select: { id: true, nom: true, imageUrl: true },
        },
        commande: {
          select: {
            id: true,
            produitRecherche: true,
            territoire: true,
            quantiteTotal: true,
            prixUnitaire: true,
            statut: true,
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
    });

    return commandes;
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

          // Notifier le collecteur
        try {
          const notificationData = {
            type: NotificationType.commande,
            titre: 'Proposition reçue',
            message: `Un paysan a proposé ${dto.quantite} ${commande.unite} pour votre demande de ${commande.produitRecherche}`,
            lien: `/commandes/${commande.id}`,
            reference_id: commande.id,
            reference_type: 'commande',
            userId: commande.collecteurId,
          };
          await this.notifyService.envoieNotifyOneUser(notificationData);
        } catch (notifyErr) {
          this.logger.warn(`Impossible d'envoyer notification au collecteur: ${notifyErr.message}`);
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


  
}
