import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, type ConfigType } from '@nestjs/config';
import { ScanController } from './controllers/scan.controller';
import { SqlmapApiService } from './services/sqlmap-api.service';
import appConfig from './config/app.config';
import redisConfig from './config/redis.config';
import sqlmapConfig from './config/sqlmap.config';
import bullmqConfig, { BULLMQ_QUEUE_NAME } from './config/bullmq.config';
import { ScanProcessor } from './processors/scan.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, redisConfig, sqlmapConfig, bullmqConfig],
    }),
    BullModule.forRootAsync({
      useFactory: (
        redisCfg: ConfigType<typeof redisConfig>,
      ) => {
        return ({
          connection: {
            host: redisCfg.host,
            port: redisCfg.port,
            password: redisCfg.password,
            db: redisCfg.db,
          },
        });
      },
      inject: [redisConfig.KEY],
    }),
    BullModule.registerQueueAsync({
      name: BULLMQ_QUEUE_NAME,
      useFactory: async () => ({
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
    }),
  ],
  controllers: [ScanController],
  providers: [ScanProcessor, SqlmapApiService],
})
export class AppModule {}
