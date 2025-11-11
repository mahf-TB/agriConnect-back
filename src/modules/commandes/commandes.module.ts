import { Module } from '@nestjs/common';
import { CommandesController } from './commandes.controller';
import { CommandesService } from './commandes.service';
import { PrismaService } from 'src/prisma.service';
import { ProduitsService } from '../produits/produits.service';

@Module({
  controllers: [CommandesController],
  providers: [CommandesService, PrismaService, ProduitsService]
})
export class CommandesModule {}
