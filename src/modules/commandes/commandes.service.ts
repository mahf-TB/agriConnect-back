import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateDemandeDto } from './dto/create-demande.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProduitsService } from '../produits/produits.service';
import { calculerDistanceKm } from 'src/common/utils/geo.utils';
import { FilterCommandeDto } from './dto/filter-commande.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from 'generated/enums';
import {
  mapCommandesToClean,
  mapCommandeToClean,
} from 'src/common/mappers/commande.mapper';
import { paginate, PaginatedResult } from 'src/common/utils/pagination';
import { CleanCommande } from 'src/common/types/commande.types';

@Injectable()
export class CommandesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly produitService: ProduitsService,
    private readonly notifyService: NotificationsService,
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
      const userIds = Array.from(
        new Set(produitsProches.map((p) => p.paysan.id)),
      );

      const dataEnvoie = {
        type: NotificationType.alerte,
        titre: 'Nouvelle demande de produit',
        message: `Une nouvelle demande de ${dto.produitRecherche} a été créée près de chez vous.`,
        lien: `/demandes/${comd.id}`,
        reference_id: comd.id,
        reference_type: 'commande',
        userIds: userIds,
      };
      await this.notifyService.envoieNotify(dataEnvoie);

      return comd;
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
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<CleanCommande>> {
    const skip = (page - 1) * limit;
    try {
      const { statut, produitRecherche, territoire, dateDebut, dateFin } =
        filters || {};

      const [commandes, total] = await Promise.all([
        await this.prisma.commande.findMany({
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
          include: {
            collecteur: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        await this.prisma.commande.count({ where: filters }),
      ]);
      const cleaned = mapCommandesToClean(commandes);
      return paginate(cleaned, total, { page, limit });
    } catch (error) {
      throw new BadRequestException(
        'Erreur lors de la récupération des commandes : ' + error.message,
      );
    }
  }

  // -- -- ==================================================================================
  // -- -- Pour recuperer les demande publier pour voir le paysan
  // -- -- ==================================================================================

  async findAllDemandeAuxPaysan(
    paysanId: string,
    filters?: FilterCommandeDto,
    page = 1,
    limit = 10,
  ) :Promise<PaginatedResult<CleanCommande>> {
    const skip = (page - 1) * limit;

    const { statut, produitRecherche, territoire, dateDebut, dateFin } =
      filters || {};
    try {
      const [commandes, total] = await Promise.all([
        // 2️⃣ Récupérer toutes les commandes ouvertes ou en cours
        await this.prisma.commande.findMany({
          where: {
            statut: { in: ['ouverte', 'partiellement_fournie'] },
            ...(dateDebut &&
              dateFin && {
                createdAt: {
                  gte: new Date(dateDebut),
                  lte: new Date(dateFin),
                },
              }),
          },
          include: { lignes: true, collecteur: true },
          skip,
          take: limit,
        }),
        // 3️⃣ Compter le total pour la pagination
        await this.prisma.commande.count({where: {statut: { in: ['ouverte', 'partiellement_fournie'] }}})
      ]);

      // 2️⃣ Pour chaque commande, vérifier si le paysan a un produit correspondant dans le rayon
      const resultats = await Promise.all(
        commandes.map(async (cmd) => {
          const produitsTrouves = await this.findProduitDansRayon(
            cmd.latitude,
            cmd.longitude,
            cmd.rayon,
            '',
            paysanId,
          );

          if (produitsTrouves.length > 0) {
            return cmd;
          }
          return null;
        }),
      );

      // 3️⃣ Retourner uniquement les commandes pertinentes
      const dataResultat = resultats.filter((r) => r !== null);
      const cleaned = mapCommandesToClean(dataResultat);
      return paginate(cleaned, total, { page, limit });
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
    produitRecherche?: string,
    paysanId?: string,
  ) {
    // Récupérer tous les paysans qui ont ce produit
    const produits = await this.prisma.produit.findMany({
      where: {
        nom: { contains: produitRecherche },
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
