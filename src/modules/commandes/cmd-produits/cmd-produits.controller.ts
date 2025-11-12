import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { CmdProduitsService } from './cmd-produits.service';
import { CreatePropositionDto } from './dto/create-proposition.dto';

@Controller('commande-produits')
export class CmdProduitsController {
  constructor(private readonly commandeProduitService: CmdProduitsService) {}
  @Get('paysan/:paysanId')
  async getCommandesByPaysan(@Param('paysanId') paysanId: string) {
    return this.commandeProduitService.getCommandesByPaysan(paysanId);
  }

  @Post(':commandeId/propositions')
async proposerProduit(
  @Param('commandeId') commandeId: string,
  @Body() dto: CreatePropositionDto,
  @Request() req: any,
) {
    const paysanId = req.user.id;
  return this.commandeProduitService.proposerProduit(commandeId, {...dto, paysanId });
}
}
