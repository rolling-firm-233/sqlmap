import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScanProcessor } from '../processors/scan.processor';
import { SqlmapApiService } from '../services/sqlmap-api.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scan-queue',
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
  ],
  providers: [ScanProcessor, SqlmapApiService],
  exports: [BullModule],
})
export class ScanQueueModule {}
