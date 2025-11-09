import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { ProduitStatut } from 'src/generated/enums';

@Injectable()
export class ProduitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProduitDto) {
    return this.prisma.produit.create({ data });
  }

  async findAll(params?: any) {
    return this.prisma.produit.findMany({
      where: params,
      include: { paysan: true },
      orderBy: { createdAt: 'desc' },
    });
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
