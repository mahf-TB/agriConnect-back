import { Module } from '@nestjs/common';
import { CommandesController } from './commandes.controller';
import { CommandesService } from './commandes.service';
import { PrismaService } from 'src/prisma.service';
import { ProduitsService } from '../produits/produits.service';
import { CmdProduitsModule } from './cmd-produits/cmd-produits.module';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationGateway } from '../notifications/notification.gateway';

@Module({
  controllers: [CommandesController],
  providers: [
    CommandesService,
    PrismaService,
    ProduitsService
  ],
  imports: [CmdProduitsModule, NotificationsModule],
})
export class CommandesModule {}
