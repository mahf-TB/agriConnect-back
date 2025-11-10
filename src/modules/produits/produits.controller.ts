import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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

@UseGuards(JwtAuthGuard)
@Controller('produits')
export class ProduitsController {
  constructor(private readonly produitService: ProduitsService) {}

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
    return this.produitService.create({ ...dto, paysanId, imageUrl });
  }

  @Get()
  findAll(@Req() req, @Query() query) {
    console.log(query);

    return this.produitService.findAll(
      req,
      {
        type: query?.type,
        statut: query?.statut,
        paysanId: query?.paysanId,
        search: query?.search,
      },
      Number(query.page),
      Number(query.limit),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.produitService.findOne(id, req);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProduitDto) {
    if (dto.quantiteDisponible <= 0) {
      throw new BadRequestException(
        'La quantité disponible doit être supérieure à 0',
      );
    }

    if (dto.prixUnitaire <= 0) {
      throw new BadRequestException('Le prix unitaire doit être supérieur à 0');
    }
    return this.produitService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.produitService.delete(id);
  }
}
