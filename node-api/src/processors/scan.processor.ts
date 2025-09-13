import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { SqlmapApiService } from '../services/sqlmap-api.service';
import { ScanTaskDto } from '../dto/scan-task.dto';

export interface ScanJobData {
  taskId?: string;
  scanOptions: ScanTaskDto;
  metadata?: {
    userId?: string;
    requestId?: string;
    priority?: number;
  };
}

@Injectable()
@Processor('scan-queue')
export class ScanProcessor extends WorkerHost {
  private readonly logger = new Logger(ScanProcessor.name);

  constructor(private readonly sqlmapApiService: SqlmapApiService) {
    super();
  }

  async process(job: Job<ScanJobData>): Promise<any> {
    const { taskId, scanOptions, metadata } = job.data;
    let currentTaskId = taskId;

    try {
      this.logger.log(`Processing scan job ${job.id} for target: ${scanOptions.target}`);

      // Create task if not provided
      if (!currentTaskId) {
        currentTaskId = await this.sqlmapApiService.createTask();
        this.logger.log(`Created SQLMap task: ${currentTaskId}`);
      }

      // Update job progress
      await job.updateProgress(10);

      // Set task options
      await this.sqlmapApiService.setTaskOptions(currentTaskId, scanOptions);
      await job.updateProgress(20);

      // Start the scan
      await this.sqlmapApiService.startScan(currentTaskId);
      await job.updateProgress(30);

      // Monitor scan progress
      const result = await this.monitorScan(currentTaskId, job);
      
      this.logger.log(`Scan completed for task ${currentTaskId}`);
      return {
        taskId: currentTaskId,
        status: 'completed',
        result,
        metadata,
      };

    } catch (error) {
      this.logger.error(`Scan job ${job.id} failed:`, error);
      
      // Try to clean up the task if it was created
      if (currentTaskId) {
        try {
          await this.sqlmapApiService.killScan(currentTaskId);
          await this.sqlmapApiService.deleteTask(currentTaskId);
        } catch (cleanupError) {
          this.logger.error(`Failed to cleanup task ${currentTaskId}:`, cleanupError);
        }
      }

      throw error;
    }
  }

  private async monitorScan(taskId: string, job: Job): Promise<any> {
    const maxAttempts = 1000; // Maximum monitoring attempts
    const checkInterval = 5000; // Check every 5 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await this.sqlmapApiService.getScanStatus(taskId);

        console.log(status);
        
        
        if (status.status === 'terminated') {
          // Scan completed, get the results
          const scanData = await this.sqlmapApiService.getScanData(taskId);
          const scanLog = await this.sqlmapApiService.getScanLog(taskId);
          
          return {
            status: 'terminated',
            data: scanData,
            log: scanLog,
            progress: 100,
          };
        }

        if (status.status === 'running') {
          // Update progress based on status
          const progress = Math.min(30 + (attempts * 0.1), 95);
          await job.updateProgress(progress);
          
          this.logger.debug(`Scan ${taskId} is running, progress: ${progress}%`);
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        attempts++;

      } catch (error) {
        this.logger.error(`Error monitoring scan ${taskId}:`, error);
        throw error;
      }
    }

    // If we reach here, the scan took too long
    throw new Error(`Scan ${taskId} exceeded maximum monitoring time`);
  }

  async onCompleted(job: Job<ScanJobData>, result: any) {
    this.logger.log(`Scan job ${job.id} completed successfully`);
    this.logger.debug(`Result:`, result);
  }

  async onFailed(job: Job<ScanJobData>, error: Error) {
    this.logger.error(`Scan job ${job.id} failed:`, error);
  }

  async onStalled(job: Job<ScanJobData>) {
    this.logger.warn(`Scan job ${job.id} stalled`);
  }
}
