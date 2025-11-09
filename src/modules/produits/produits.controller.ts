import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProduitsService } from './produits.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { UpdateProduitDto } from './dto/update-produit.dto';

@UseGuards(JwtAuthGuard)
@Controller('produits')
export class ProduitsController {
  constructor(private readonly produitService: ProduitsService) {}

  @Post()
  create(@Body() dto: CreateProduitDto , @Request() req : any) {
    const paysanId = req.user.id;    
    return this.produitService.create({...dto , paysanId});
  }

  @Get()
  findAll() {
    return this.produitService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.produitService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProduitDto) {
    return this.produitService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.produitService.delete(id);
  }
}
