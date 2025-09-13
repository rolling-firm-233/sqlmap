import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScanController } from './controllers/scan.controller';
import { ScanQueueModule } from './modules/scan-queue.module';
import { SqlmapApiService } from './services/sqlmap-api.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0', 10),
      },
    }),
    ScanQueueModule,
  ],
  controllers: [AppController, ScanController],
  providers: [AppService, SqlmapApiService],
})
export class AppModule {}
