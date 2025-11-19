import { Module } from '@nestjs/common';
import { CmdProduitsService } from './cmd-produits.service';
import { CmdProduitsController } from './cmd-produits.controller';
import { PrismaService } from 'src/prisma.service';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  providers: [CmdProduitsService, PrismaService],
  controllers: [CmdProduitsController],
  imports: [NotificationsModule],
  exports: [CmdProduitsService],
})
export class CmdProduitsModule {}
