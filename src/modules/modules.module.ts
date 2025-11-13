import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { ProduitsModule } from './produits/produits.module';
import { CommandesModule } from './commandes/commandes.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [CoreModule, ProduitsModule, CommandesModule, NotificationsModule],
})
export class ModulesModule {}
