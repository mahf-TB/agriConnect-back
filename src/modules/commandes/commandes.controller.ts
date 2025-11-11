import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { CommandesService } from './commandes.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { CreateDemandeDto } from './dto/create-demande.dto';

@UseGuards(JwtAuthGuard)
@Controller('commandes')
export class CommandesController {
  constructor(private readonly cmdService: CommandesService) {}

  @Post()
  createCommande(@Body() dto: CreateOrderDto, @Request() req: any) {
    const collecteurId = req.user.id;
    return this.cmdService.createCommandeProduit({ ...dto, collecteurId });
  }

  @Post()
  createDemande(@Body() dto: CreateDemandeDto, @Request() req: any) {
    const collecteurId = req.user.id;
    return this.cmdService.createDemande(collecteurId, dto);
  }
}
