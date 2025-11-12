import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommandesService } from './commandes.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { CreateDemandeDto } from './dto/create-demande.dto';
import { FilterCommandeDto } from './dto/filter-commande.dto';

@UseGuards(JwtAuthGuard)
@Controller('commandes')
export class CommandesController {
  constructor(private readonly cmdService: CommandesService) {}

  @Post()
  createCommande(@Body() dto: CreateOrderDto, @Request() req: any) {
    const collecteurId = req.user.id;
    return this.cmdService.createCommandeProduit({ ...dto, collecteurId });
  }


  @Post('demander')
  createDemande(@Body() dto: CreateDemandeDto, @Request() req: any) {
    const collecteurId = req.user.id;
    return this.cmdService.createDemande(collecteurId, dto);
  }



  @Get('collecteur/:collecteurId')
  async getAllCommandesCollecteur(
    @Param('collecteurId') collecteurId: string,
    @Query() filters: FilterCommandeDto,
  ) {
    return this.cmdService.findAllCommandesCollecteur(collecteurId, filters);
  }



  @Get('paysan')
  async getAllDemandeAuxPaysan(
    @Query() filters: FilterCommandeDto,
    @Request() req:any
  ) {
    const paysanId = req.user.id;
    return this.cmdService.findAllDemandeAuxPaysan(paysanId, filters);
  }

  
}
