import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { ProduitStatut, ProduitType } from 'generated/enums';
import {
  mapProduitsToClean,
  mapProduitToClean,
  ProduitWithPaysan,
} from 'src/common/mappers/produit.mapper';
import { CleanProduit, PaginatedProduits } from 'src/common/types/produit.types';
import { paginate, PaginatedResult } from 'src/common/utils/pagination';

@Injectable()
export class ProduitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateProduitDto & { paysanId: string; imageUrl?: string },
  ) {
    this.validateProduitData(data);
    return this.prisma.produit.create({ data });
  }

  async findAll(
    req: Request,
    params?: {
      type?: ProduitType;
      statut?: ProduitStatut;
      paysanId?: string;
      search?: string;
    },
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<CleanProduit>> {
    const skip = (page - 1) * limit;

    // 🧩 Construction dynamique des xfiltres Prisma
    const where: any = {};

    if (params?.type) where.type = params.type;
    if (params?.statut) where.statut = params.statut;
    if (params?.paysanId) where.paysanId = params.paysanId;
    if (params?.search) {
      where.OR = [
        { nom: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { sousType: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    // ⚙️ Requête paginée
    const [produits, total] = await Promise.all([
      this.prisma.produit.findMany({
        where,
        include: { paysan: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.produit.count({ where: params }),
    ]);
    const cleaned = mapProduitsToClean(produits, req);

    return paginate(cleaned, total, { page, limit });
  }

  async findOne(id: string, req?: Request) {
    const produit = await this.prisma.produit.findUnique({
      where: { id },
      include: { paysan: true },
    });
    if (!produit) throw new NotFoundException('Produit non trouvé');
    return mapProduitToClean(produit, req);
  }

  async update(id: string, data: UpdateProduitDto) {
    this.validateProduitData(data);
    return this.prisma.produit.update({
      where: { id },
      data,
    });
  }

  async updateStatut(id: string, statut: ProduitStatut) {
    return this.prisma.produit.update({
      where: { id },
      data: { statut },
    });
  }

  async delete(id: string) {
    return this.prisma.produit.delete({ where: { id } });
  }

  async findByPaysan(paysanId: string) {
    return this.prisma.produit.findMany({
      where: { paysanId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProduitsDisponibles() {
    return this.prisma.produit.findMany({
      where: { statut: 'disponible' },
    });
  }

  private validateProduitData(data: any) {
    if (data.quantiteDisponible <= 0) {
      throw new BadRequestException(
        'La quantité disponible doit être supérieure à 0',
      );
    }
    if (data.prixUnitaire <= 0) {
      throw new BadRequestException('Le prix unitaire doit être supérieur à 0');
    }
  }

  //   async search(term: string) {
  //     return this.prisma.produit.findMany({
  //       where: {
  //         OR: [
  //           { nom: { contains: term, mode: 'insensitive' } },
  //           { description: { contains: term, mode: 'insensitive' } },
  //           { sousType: { contains: term, mode: 'insensitive' } },
  //         ],
  //       },
  //       orderBy: { createdAt: 'desc' },
  //     });
  //   }
}
