import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { CmdProduitsService } from './cmd-produits.service';
import { CreatePropositionDto } from './dto/create-proposition.dto';
import { JwtAuthGuard } from 'src/modules/core/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('commande-produits')
export class CmdProduitsController {
  constructor(private readonly commandeProduitService: CmdProduitsService) {}
  @Get('paysan')
  async getCommandesByPaysan(@Request() req: any) {
    const paysanId = req.user.id;
    return this.commandeProduitService.getCommandesReciviedByPaysan(paysanId);
  }

  @Post(':commandeId/propositions')
  async proposerProduit(
    @Param('commandeId') commandeId: string,
    @Body() dto: CreatePropositionDto,
    @Request() req: any,
  ) {
    const paysanId = req.user.id;
    return this.commandeProduitService.proposerProduit(commandeId, {
      ...dto,
      paysanId,
    });
  }
}
