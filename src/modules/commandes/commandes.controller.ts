import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommandesService } from './commandes.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/auth/guards/roles.guard';
import { CreateDemandeDto } from './dto/create-demande.dto';
import { FilterCommandeDto } from './dto/filter-commande.dto';
import { Roles } from 'src/common/decorators/roles.decorator';

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
    @Request() req: any,
  ) {
    const paysanId = req.user.id;
    return this.cmdService.findAllDemandeAuxPaysan(paysanId, filters);
  }

  @UseGuards(RolesGuard)
  @Roles('admin' as any)
  @Get('admin/all')
  async getAllCommandesAdmin(
    @Query() filters: FilterCommandeDto,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20)); // max 100 résultats par page
    return this.cmdService.findAllCommandesAdmin(filters, pageNum, limitNum);
  }

  @Patch(':commandeId/annuler')
  async annulerCommande(
    @Param('commandeId') commandeId: string,
    @Request() req, // req.user.id = collecteur
    @Body('raison') raison?: string,
  ) {
    const collecteurId = req.user.id;
    return this.cmdService.annulerCommande(collecteurId, commandeId, raison);
  }

      // ==================================================
  // Refuser une commande
  // ==================================================
  @Patch(':commandeId/refuser')
  async refuserCommande(
    @Param('commandeId') commandeId: string,
     @Request() req,
  ) {
    const paysanId = req.user.id;
    return this.cmdService.payerCommande(
      paysanId,
      commandeId
    );
  }
}
