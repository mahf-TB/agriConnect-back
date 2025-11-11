import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { CommandesService } from './commandes.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('commandes')
export class CommandesController {
  constructor(private readonly cmdService: CommandesService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Request() req: any) {
    const collecteurId = req.user.id;
    return this.cmdService.createCommandeProduit({...dto , collecteurId} );
  }
}
