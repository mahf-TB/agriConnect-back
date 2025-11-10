import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { ProduitStatut } from 'src/generated/enums';
import { mapProduitsToClean } from 'src/common/mappers/produit.mapper';
import { PaginatedProduits } from 'src/common/types/produit.types';
import { paginate } from 'src/common/utils/pagination';

@Injectable()
export class ProduitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProduitDto & { paysanId: string , imageUrl?: string }) {
    if (data.quantiteDisponible <= 0) {
      throw new BadRequestException(
        'La quantité disponible doit être supérieure à 0',
      );
    }
    if (data.prixUnitaire <= 0) {
      throw new BadRequestException('Le prix unitaire doit être supérieur à 0');
    }
    return this.prisma.produit.create({ data });
  }

  async findAll(params?: any, page = 1, limit = 2): Promise<PaginatedProduits> {
    const skip = (page - 1) * limit;

    const [produits, total] = await Promise.all([
      this.prisma.produit.findMany({
        where: params,
        include: { paysan: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.produit.count({ where: params }),
    ]);
    const cleaned = mapProduitsToClean(produits);

    return paginate(cleaned, total, { page, limit });
  }

  async findOne(id: string) {
    const produit = await this.prisma.produit.findUnique({ where: { id } });
    if (!produit) throw new NotFoundException('Produit non trouvé');
    return produit;
  }

  async update(id: string, data: UpdateProduitDto) {
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
