import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateDemandeDto } from './dto/create-demande.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProduitsService } from '../produits/produits.service';
import { calculerDistanceKm } from 'src/common/utils/geo.utils';
import { FilterCommandeDto } from './dto/filter-commande.dto';

@Injectable()
export class CommandesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly produitService: ProduitsService,
  ) {}

  async createDemande(collecteurId: string, dto: CreateDemandeDto) {
    try {
      const comd = await this.prisma.commande.create({
        data: {
          produitRecherche: dto.produitRecherche,
          quantiteTotal: dto.quantiteTotal,
          prixUnitaire: dto.prixUnitaire,
          messageCollecteur: dto.messageCollecteur,
          collecteurId: collecteurId,
          adresseLivraison: dto.adresseLivraison,
          dateLivraisonPrevue: dto.dateLivraisonPrevue,
          territoire: dto.territoire,
          latitude: dto.latitude,
          longitude: dto.longitude,
          rayon: dto.rayonKm,
        },
      });

      const produitsProches = await this.findProduitDansRayon(
        dto.latitude,
        dto.longitude,
        dto.rayonKm,
        dto.produitRecherche,
      );

      // 3️⃣ Extraire les paysans uniques
      const paysansUniques = Array.from(
        new Map(produitsProches.map((p) => [p.paysan.id, p.paysan])).values(),
      );

      return paysansUniques;
    } catch (error) {
      throw new BadRequestException(
        'La création de la demande de produit a échoué. Veuillez réessayer.',
      );
    }
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
            produitRecherche: existingProduit.nom,
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
        // 📦 Mise à jour du stock du produit
        await tx.produit.update({
          where: { id: dto.produitId },
          data: {
            quantiteDisponible:
              existingProduit.quantiteDisponible - dto.quantiteAccordee,
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

  async findAllCommandesCollecteur(
    collecteurId: string,
    filters?: FilterCommandeDto,
  ) {
    try {
      const { statut, produitRecherche, territoire, dateDebut, dateFin } =
        filters || {};

      const commandes = await this.prisma.commande.findMany({
        where: {
          collecteurId,
          ...(statut && { statut }),
          ...(produitRecherche && {
            produitRecherche: {
              contains: produitRecherche,
            },
          }),
          ...(territoire && {
            territoire: {
              contains: territoire,
            },
          }),
          ...(dateDebut &&
            dateFin && {
              createdAt: {
                gte: new Date(dateDebut),
                lte: new Date(dateFin),
              },
            }),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return commandes;
    } catch (error) {
      throw new BadRequestException(
        'Erreur lors de la récupération des commandes : ' + error.message,
      );
    }
  }


  async findAllDemandeAuxPaysan(paysanId: string, filters?: FilterCommandeDto) {
    try {
      const { statut, produitRecherche, territoire, dateDebut, dateFin } =
        filters || {};
      // 2️⃣ Récupérer toutes les commandes ouvertes ou en cours
      const commandes = await this.prisma.commande.findMany({
        where: {
          statut: { in: ['ouverte', 'partiellement_fournie'] },
        },
        include: { lignes: true },
      });
      // 2️⃣ Pour chaque commande, vérifier si le paysan a un produit correspondant dans le rayon
      const resultats = await Promise.all(
        commandes.map(async (cmd) => {
          const produitsTrouves = await this.findProduitDansRayon(
            cmd.latitude,
            cmd.longitude,
            cmd.rayon,
            cmd.produitRecherche,
            paysanId,
          );

          if (produitsTrouves.length > 0) {
            return cmd;
          }
          return null;
        }),
      );

      // 3️⃣ Retourner uniquement les commandes pertinentes
      return resultats.filter((r) => r !== null);
    } catch (error) {
      throw new BadRequestException(
        'Erreur lors de la récupération des commandes : ' + error.message,
      );
    }
  }

  
  // Exemple simple de recherche de produit dans un rayon (Haversine)
  private async findProduitDansRayon(
    lat: number,
    lon: number,
    rayonKm = 10,
    produitRecherche: string,
    paysanId?: string,
  ) {
    // Récupérer tous les paysans qui ont ce produit
    const produits = await this.prisma.produit.findMany({
      where: {
        // nom: { contains: produitRecherche },
        ...(paysanId && { paysanId }),
        paysan: {
          latitude: { not: null },
          longitude: { not: null },
        },
        statut: 'disponible',
      },
      include: { paysan: true },
    });

    // calcul simplifié
    return produits.filter((prod) => {
      if (!prod.latitude || !prod.longitude) return false;
      const distance = calculerDistanceKm(
        lat,
        lon,
        prod.latitude,
        prod.longitude,
      );
      return distance <= rayonKm;
    });
  }
}
