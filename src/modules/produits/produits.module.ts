import { Module } from '@nestjs/common';
import { ProduitsService } from './produits.service';
import { ProduitsController } from './produits.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [ProduitsService, PrismaService],
  controllers: [ProduitsController]
})
export class ProduitsModule {}
