import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProduitsService } from './produits.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { FileUploadInterceptor } from 'src/common/interceptors/file-upload.interceptor';
import { deleteUploadedFile } from 'src/common/utils/file';

@UseGuards(JwtAuthGuard)
@Controller('produits')
export class ProduitsController {
  constructor(private readonly produitService: ProduitsService) { }

  @Post()
  @UseInterceptors(FileUploadInterceptor('image', 'produits'))
  create(
    @UploadedFile() file: any,
    @Body() dto: CreateProduitDto,
    @Request() req: any,
  ) {
    const paysanId = req.user.id;
    // path relatif pour la DB
    const imageUrl = file ? `/uploads/produits/${file.filename}` : null;
    try {
      return this.produitService.create({ ...dto, paysanId, imageUrl });
    } catch (error) {
      if (file) deleteUploadedFile(imageUrl);
      throw new BadRequestException(
        'Échec de la création du produit. Veuillez réessayer.',
      );
    }
  }

  @Get()
  findAll(@Req() req, @Query() query) {
    const { page = 1, limit = 2, type, statut, paysanId, search } = query;
    return this.produitService.findAll(
      req,
      {
        type,
        statut,
        paysanId,
        search,
      },
      Number(page),
      Number(limit),
    );
  }

  @Get('paysan')
  getAllProduitPaysan(@Req() req: any, @Query() query: any) {
    const { page = 1, limit = 2, type, statut, search } = query;
    const paysanId = req.user.id;

    return this.produitService.findAllProduitDuPaysan(
      req,
      {
        type,
        paysanId,
        statut,
        search,
      },
      Number(page),
      Number(limit),
    );
  }

  @Get('paysan/:id')
  getAllProduitForPaysan(
    @Param('id') paysanId: string,
    @Query() query: any,
    @Req() req: any,
  ) {
    const { page = 1, limit = 2, type, statut, search } = query;

    return this.produitService.findAllProduitDuPaysan(
      req,
      {
        type,
        paysanId,
        statut,
        search,
      },
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.produitService.findOne(id, req);
  }

  @Put(':id')
  @UseInterceptors(FileUploadInterceptor('image', 'produits'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProduitDto,
    @UploadedFile() file: any,
  ) {
    // ✅ On récupère la version brute du produit (pas CleanProduit)
    const existingProduit = await this.produitService.findOne(id);
    if (!existingProduit) throw new BadRequestException('Produit non trouvé');
    const newImageUrl = file
      ? `/uploads/produits/${file.filename}`
      : existingProduit.imageUrl;

    try {
      // ✅ Mise à jour du produit dans la DB
      const updatedProduit = await this.produitService.update(id, {
        ...dto,
        imageUrl: newImageUrl,
      });
      // ✅ Si une nouvelle image a été uploadée → supprimer l’ancienne
      if (existingProduit.imageUrl)
        deleteUploadedFile(existingProduit.imageUrl);
      return updatedProduit;
    } catch (error) {
      // ❌ Si échec → supprimer le nouveau fichier uploadé
      if (file) deleteUploadedFile(newImageUrl);
      throw new BadRequestException(
        'Échec de la mise à jour du produit. Veuillez réessayer.',
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // Récupérer le produit existant
    const existingProduit = await this.produitService.findOne(id);
    if (!existingProduit) {
      throw new BadRequestException('Produit non trouvé');
    }
    try {
      // Supprimer le produit de la DB
      await this.produitService.delete(id);
      // Supprimer l’image si elle existe
      if (existingProduit.imageUrl)
        deleteUploadedFile(existingProduit.imageUrl);

      return { message: 'Produit supprimé avec succès' };
    } catch (error) {
      throw new BadRequestException(
        'Échec de la suppression du produit. Veuillez réessayer.',
      );
    }
  }


  @Get('stats/paysan')
  async getMyProductsStats(@Req() req) {
    return this.produitService.getProductsStats(req.user.id);
  }


  @Get('stats/user/:userId')
  async getProductsStatsByUserId(@Param('userId') userId: string) {
    return this.produitService.getProductsStatsByUserId(userId);
  }

  @Get('stats/global')
  async getGlobalProductsStats() {
    return this.produitService.getProductsStatsGlobal();
  }
}
