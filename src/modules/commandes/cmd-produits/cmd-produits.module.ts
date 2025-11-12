import { Module } from '@nestjs/common';
import { CmdProduitsService } from './cmd-produits.service';
import { CmdProduitsController } from './cmd-produits.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [CmdProduitsService, PrismaService],
  controllers: [CmdProduitsController]
})
export class CmdProduitsModule {}
