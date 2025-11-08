import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { ProduitsModule } from './produits/produits.module';
import { CommandesModule } from './commandes/commandes.module';

@Module({
  imports: [CoreModule, ProduitsModule, CommandesModule]
})
export class ModulesModule {}
