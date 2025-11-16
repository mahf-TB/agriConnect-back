import { Module } from '@nestjs/common';
import { ModulesModule } from './modules/modules.module';
import { ConfigModule } from '@nestjs/config';
import { WebsocketsModule } from './common/websockets/websockets.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ModulesModule,
    WebsocketsModule,
    AiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
