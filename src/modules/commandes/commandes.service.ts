import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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

/**
 * Service gérant l'ensemble des opérations métier liées aux commandes
 * - Création de demandes et commandes
 * - Gestion du statut des commandes
 * - Recherche géographique de produits
 * - Notifaction aux paysans
 */
@Injectable()
export class CommandesService {
  private readonly logger = new Logger(CommandesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly produitService: ProduitsService,
    private readonly notifyService: NotificationsService,
  ) {}

  /**
   * Crée une demande de produit et notifie les paysans dans le rayon
   * @param collecteurId ID du collecteur qui crée la demande
   * @param dto Données de la demande
   * @returns Commande créée
   */
  async createDemande(collecteurId: string, dto: CreateDemandeDto) {
    this.logger.debug(`Création demande pour collecteur: ${collecteurId}`);

    try {
      // 1️⃣ Créer la commande (demande)
      const commande = await this.createCommandeRecord(collecteurId, dto);

      // 2️⃣ Chercher les produits correspondants dans le rayon
      const produitsProches = await this.findProduitDansRayon(
        dto.latitude,
        dto.longitude,
        dto.rayon,
        dto.produitRecherche,
      );

      // 3️⃣ Notifier les paysans concernés
      if (produitsProches.length > 0) {
        await this.notifyFarmersNearby(
          produitsProches,
          commande,
          dto.produitRecherche,
        );
      }

      return commande;
    } catch (error) {
      this.logger.error(
        `Erreur création demande: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'La création de la demande de produit a échoué. Veuillez réessayer.',
      );
    }
  }

  /**
   * Crée une commande de produit spécifique (paysan accepte la demande)
   * Transaction atomique pour garantir la cohérence des données
   * @param dto Données de la commande avec collecteurId
   * @returns Commande avec ses lignes
   */
  async createCommandeProduit(dto: CreateOrderDto & { collecteurId: string }) {
    this.logger.debug(
      `Création commande produit pour collecteur: ${dto.collecteurId}`,
    );

    try {
      // Validation du produit
      const existingProduit = await this.produitService.findOne(dto.produitId);
      if (!existingProduit) {
        throw new BadRequestException('Produit non trouvé');
      }

      if (dto.quantiteAccordee > existingProduit.quantiteDisponible) {
        throw new BadRequestException(
          this.buildQuantityErrorMessage(
            dto.quantiteAccordee,
            existingProduit.quantiteDisponible,
          ),
        );
      }

      // Transaction atomique: création commande + ligne + mise à jour stock
      const result = await this.prisma.$transaction(async (tx) => {
        return await this.executeOrderTransaction(tx, dto, existingProduit);
      });

      this.logger.log(`Commande créée avec succès: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erreur création commande: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'La création de la commande a échoué. Veuillez réessayer.',
      );
    }
  }

  /**
   * Récupère toutes les commandes d'un collecteur avec filtrage et pagination
   * @param collecteurId ID du collecteur
   * @param filters Critères de filtrage
   * @param page Numéro de page (défaut: 1)
   * @param limit Résultats par page (défaut: 10)
   * @returns Résultats paginés
   */
  async findAllCommandesCollecteur(
    collecteurId: string,
    filters?: FilterCommandeDto,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<CleanCommande>> {
    this.logger.debug(
      `Récupération commandes collecteur: ${collecteurId}, page: ${page}`,
    );

    const skip = (page - 1) * limit;

    try {
      const whereCondition = this.buildCommandeWhereCondition(
        collecteurId,
        filters,
      );

      // Récupération parallèle des données et du total
      const [commandes, total] = await Promise.all([
        this.prisma.commande.findMany({
          where: whereCondition,
          include: {
            collecteur: true,
            lignes: {
              include: {
                produit: true, // inclure le produit lié à chaque ligne
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.commande.count({ where: whereCondition }),
      ]);

      const cleaned = mapCommandesToClean(commandes);
      return paginate(cleaned, total, { page, limit });
    } catch (error) {
      this.logger.error(
        `Erreur récupération commandes: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Erreur lors de la récupération des commandes: ' + error.message,
      );
    }
  }

  /**
   * Récupère les demandes pertinentes pour un paysan
   * Filtre les demandes géographiquement proches avec des produits correspondants
   * @param paysanId ID du paysan
   * @param filters Critères de filtrage
   * @param page Numéro de page (défaut: 1)
   * @param limit Résultats par page (défaut: 10)
   * @returns Demandes paginées et pertinentes
   */
  async findAllDemandeAuxPaysan(
    paysanId: string,
    filters?: FilterCommandeDto,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<CleanCommande>> {
    this.logger.debug(
      `Récupération demandes pour paysan: ${paysanId}, page: ${page}`,
    );

    const skip = (page - 1) * limit;
    const { dateDebut, dateFin } = filters || {};

    try {
      // 1️⃣ Récupérer les demandes ouvertes/partielles
      const whereCondition = this.buildDemandeWhereCondition(
        dateDebut,
        dateFin,
      );

      const [commandes, total] = await Promise.all([
        this.prisma.commande.findMany({
          where: whereCondition,
          include: { lignes: {
      include: {
        produit: true,     // inclure le produit lié à chaque ligne
      },
    }, collecteur: true },
          skip,
          take: limit,
        }),
        this.prisma.commande.count({ where: whereCondition }),
      ]);

      // 2️⃣ Filtrer les demandes pertinentes pour le paysan
      const relevantDemandes = await this.filterRelevantDemandesForFarmer(
        commandes,
        paysanId,
      );

      const cleaned = mapCommandesToClean(relevantDemandes);
      return paginate(cleaned, relevantDemandes.length, { page, limit });
    } catch (error) {
      this.logger.error(
        `Erreur récupération demandes: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Erreur lors de la récupération des demandes: ' + error.message,
      );
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS - Séparation des responsabilités
  // ============================================================================

  /**
   * Crée l'enregistrement de la commande en base
   */
  private async createCommandeRecord(
    collecteurId: string,
    dto: CreateDemandeDto,
  ) {
    return await this.prisma.commande.create({
      data: {
        produitRecherche: dto.produitRecherche,
        quantiteTotal: dto.quantiteTotal,
        prixUnitaire: dto.prixUnitaire,
        messageCollecteur: dto.messageCollecteur,
        collecteurId,
        adresseLivraison: dto.adresseLivraison,
        dateLivraisonPrevue: dto.dateLivraisonPrevue,
        territoire: dto.territoire,
        latitude: dto.latitude,
        longitude: dto.longitude,
        rayon: dto.rayon,
      },
    });
  }

  /**
   * Extrait les paysans uniques et envoie les notifications
   */
  private async notifyFarmersNearby(
    produitsProches: any[],
    commande: any,
    productName: string,
  ) {
    const uniqueFarmerIds = Array.from(
      new Set(produitsProches.map((p) => p.paysan.id)),
    );

    const notificationData = {
      type: NotificationType.commande,
      titre: 'Nouvelle demande de produit',
      message: `Une nouvelle demande de ${productName} a été créée près de chez vous.`,
      lien: `/demandes/${commande.id}`,
      reference_id: commande.id,
      reference_type: 'commande',
      userIds: uniqueFarmerIds,
    };

    await this.notifyService.envoieNotify(notificationData);
    this.logger.log(
      `Notifications envoyées à ${uniqueFarmerIds.length} paysans`,
    );
  }

  /**
   * Exécute la transaction atomique de création de commande
   */
  private async executeOrderTransaction(
    tx: any,
    dto: CreateOrderDto & { collecteurId: string },
    existingProduit: any,
  ) {
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

    // 2️⃣ Déterminer le statut de la ligne
    const statutLigne = this.determineLineStatus(
      dto.quantiteAccordee,
      dto.prixUnitaire,
      existingProduit,
    );

    // 3️⃣ Création du lien CommandeProduit
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

    // 4️⃣ Mise à jour du stock
    await tx.produit.update({
      where: { id: dto.produitId },
      data: {
        quantiteDisponible:
          existingProduit.quantiteDisponible - dto.quantiteAccordee,
      },
    });

    return { ...commande, lignes: commandeProduit };
  }

  /**
   * Détermine le statut de la ligne de commande
   */
  private determineLineStatus(
    quantiteAccordee: number,
    priceUnitaire: number | undefined,
    existingProduit: any,
  ): 'en_attente' | 'acceptee' | 'partiellement_acceptee' {
    const priceMatches = priceUnitaire === existingProduit.prixUnitaire;
    const partialQuantity =
      quantiteAccordee < existingProduit.quantiteDisponible;

    if (priceMatches && partialQuantity) {
      return 'partiellement_acceptee';
    }

    if (priceMatches) {
      return 'acceptee';
    }

    return 'en_attente';
  }

  /**
   * Construit la clause WHERE pour les commandes d'un collecteur
   */
  private buildCommandeWhereCondition(
    collecteurId: string,
    filters?: FilterCommandeDto,
  ) {
    const { statut, produitRecherche, territoire, dateDebut, dateFin } =
      filters || {};

    return {
      collecteurId,
      ...(statut && { statut }),
      ...(produitRecherche && {
        produitRecherche: { contains: produitRecherche },
      }),
      ...(territoire && {
        territoire: { contains: territoire },
      }),
      ...(dateDebut &&
        dateFin && {
          createdAt: {
            gte: new Date(dateDebut),
            lte: new Date(dateFin),
          },
        }),
    };
  }

  /**
   * Construit la clause WHERE pour les demandes ouvertes
   */
  private buildDemandeWhereCondition(dateDebut?: string, dateFin?: string) {
    return {
      statut: { in: ['ouverte' as const, 'partiellement_fournie' as const] },
      ...(dateDebut &&
        dateFin && {
          createdAt: {
            gte: new Date(dateDebut),
            lte: new Date(dateFin),
          },
        }),
    };
  }

  /**
   * Filtre les demandes pertinentes pour un paysan
   * Vérifie si le paysan a des produits correspondants dans le rayon
   */
  private async filterRelevantDemandesForFarmer(
    commandes: any[],
    paysanId: string,
  ) {
    const results = await Promise.all(
      commandes.map(async (cmd) => {
        const produitsTrouves = await this.findProduitDansRayon(
          cmd.latitude,
          cmd.longitude,
          cmd.rayon,
          '',
          paysanId,
        );
        return produitsTrouves.length > 0 ? cmd : null;
      }),
    );

    return results.filter((r) => r !== null);
  }

  /**
   * Crée un message d'erreur formaté pour les quantités invalides
   */
  private buildQuantityErrorMessage(
    requested: number,
    available: number,
  ): string {
    return `La quantité demandée (${requested}) dépasse le stock disponible (${available})`;
  }

  /**
   * Recherche les produits dans un rayon géographique (formule Haversine)
   * @param lat Latitude de la demande
   * @param lon Longitude de la demande
   * @param rayonKm Rayon de recherche en km
   * @param produitRecherche Nom du produit (optionnel)
   * @param paysanId ID du paysan (optionnel)
   * @returns Produits trouvés avec leurs paysans
   */
  private async findProduitDansRayon(
    lat: number,
    lon: number,
    rayonKm = 10,
    produitRecherche?: string,
    paysanId?: string,
  ) {
    // Récupérer les produits correspondants
    const produits = await this.prisma.produit.findMany({
      where: {
        ...(produitRecherche && { nom: { contains: produitRecherche } }),
        ...(paysanId && { paysanId }),
        paysan: {
          latitude: { not: null },
          longitude: { not: null },
        },
        statut: 'disponible',
      },
      include: { paysan: true },
    });

    // Filtrer par distance (Haversine)
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
