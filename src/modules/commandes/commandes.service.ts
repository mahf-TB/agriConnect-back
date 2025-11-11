import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateDemandeDto } from './dto/create-demande.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProduitsService } from '../produits/produits.service';

@Injectable()
export class CommandesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly produitService: ProduitsService,
  ) {}

  async createDemande(collecteurId: string, dto: CreateDemandeDto) {
    return this.prisma.commande.create({
      data: {
        produitRecherche: dto.produitRecherche,
        quantiteTotal: dto.quantiteTotal,
        prixUnitaire: dto.prixUnitaire,
        territoire: dto.territoire,
        messageCollecteur: dto.messageCollecteur,
        collecteurId: collecteurId,
        adresseLivraison: dto.adresseLivraison,
      },
    });
  }

  async createCommandeProduit(dto: CreateOrderDto & { collecteurId: string }) {
    // ✅ On récupère la version brute du produit (pas CleanProduit)
    const existingProduit = await this.produitService.findOne(dto.produitId);
    if (!existingProduit) throw new BadRequestException('Produit non trouvé');

    if (dto.quantiteAccordee > existingProduit.quantiteDisponible) {
      throw new BadRequestException(
        `La quantité demandée (${dto.quantiteAccordee}) dépasse le stock disponible (${existingProduit.quantiteDisponible})`,
      );
    }
    try {
      // ⚙️ Transaction atomique : commande + commandeProduit
      const result = await this.prisma.$transaction(async (tx) => {
        // 1️⃣ Création de la commande
        const commande = await tx.commande.create({
          data: {
            adresseLivraison: dto.adresseLivraison,
            dateLivraisonPrevue: dto.dateLivraisonPrevue,
            messageCollecteur: dto.messageCollecteur,
            collecteurId: dto.collecteurId,
            statut: 'en_attente',
            quantiteTotal: dto.quantiteAccordee,
            prixUnitaire: dto.prixUnitaire ?? existingProduit.prixUnitaire,
          },
        });
        // ✅ Déterminer le statut de la ligne selon la quantité
        let statutLigne: 'en_attente' | 'acceptee' | 'partiellement_acceptee' =
          'en_attente';
        if (dto.prixUnitaire === existingProduit.prixUnitaire) {
          statutLigne = 'acceptee';
          // 📦 Mise à jour du stock du produit
          await tx.produit.update({
            where: { id: dto.produitId },
            data: {
              quantiteDisponible:
                existingProduit.quantiteDisponible - dto.quantiteAccordee,
            },
          });
        }
        if (
          dto.quantiteAccordee < existingProduit.quantiteDisponible &&
          dto.prixUnitaire === existingProduit.prixUnitaire
        ) {
          statutLigne = 'partiellement_acceptee';
        }
        // 2️⃣ Création du lien CommandeProduit
        const commandeProduit = await tx.commandeProduit.create({
          data: {
            commandeId: commande.id,
            produitId: dto.produitId,
            paysanId: dto.paysanId,
            quantiteAccordee: dto.quantiteAccordee,
            prixUnitaire: dto.prixUnitaire ?? existingProduit.prixUnitaire,
            statutLigne,
          },
        });

        return { ...commande, lignes: commandeProduit };
      });
      return result;
    } catch (error) {
        console.log('❌ Erreur création commande :', error);
      throw new BadRequestException(
        'La création de la commande a échoué. Veuillez réessayer.',
      );
    }
  }
}
