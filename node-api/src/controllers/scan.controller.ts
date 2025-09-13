import { Controller, Post, Get, Body, Param, Query, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ScanTaskDto, ScanResponseDto } from '../dto/scan-task.dto';
import { SqlmapApiService } from '../services/sqlmap-api.service';

@ApiTags('scan')
@Controller('scan')
export class ScanController {
  private readonly logger = new Logger(ScanController.name);

  constructor(
    @InjectQueue('scan-queue') private scanQueue: Queue,
    private readonly sqlmapApiService: SqlmapApiService,
  ) {}

  @Post('start')
  @ApiOperation({
    summary: 'Start a new SQL injection scan',
    description: 'Queues a new SQL injection scan task for the specified target URL',
  })
  @ApiResponse({
    status: 201,
    description: 'Scan task created successfully',
    type: ScanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid scan parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async startScan(@Body() scanTask: ScanTaskDto): Promise<ScanResponseDto> {
    try {
      this.logger.log(`Starting scan for target: ${scanTask.target}`);

      const job = await this.scanQueue.add(
        'scan-task',
        {
          scanOptions: scanTask,
          metadata: {
            requestId: `req_${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
        },
        {
          priority: 1,
          delay: 0,
        },
      );

      this.logger.log(`Queued scan job: ${job.id}`);

      return {
        taskId: job.id?.toString() || '',
        status: 'queued',
        message: 'Scan task queued successfully',
      };
    } catch (error) {
      this.logger.error('Error starting scan:', error);
      return {
        taskId: '',
        status: 'error',
        error: error.message,
      };
    }
  }

  @Get('status/:jobId')
  @ApiOperation({
    summary: 'Get scan task status',
    description: 'Retrieves the current status and progress of a scan task',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Unique identifier of the scan job',
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'Scan status retrieved successfully',
    type: ScanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getScanStatus(@Param('jobId') jobId: string): Promise<ScanResponseDto> {
    try {
      const job = await this.scanQueue.getJob(jobId);
      
      if (!job) {
        return {
          taskId: jobId,
          status: 'not_found',
          error: 'Job not found',
        };
      }

      const state = await job.getState();
      const progress = job.progress;

      return {
        taskId: jobId,
        status: state,
        progress: typeof progress === 'number' ? progress : 0,
        data: job.returnvalue,
      };
    } catch (error) {
      this.logger.error(`Error getting scan status for job ${jobId}:`, error);
      return {
        taskId: jobId,
        status: 'error',
        error: error.message,
      };
    }
  }

  @Get('result/:jobId')
  @ApiOperation({
    summary: 'Get scan task results',
    description: 'Retrieves the complete results of a completed scan task',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Unique identifier of the scan job',
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'Scan results retrieved successfully',
    type: ScanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getScanResult(@Param('jobId') jobId: string): Promise<ScanResponseDto> {
    try {
      const job = await this.scanQueue.getJob(jobId);
      
      if (!job) {
        return {
          taskId: jobId,
          status: 'not_found',
          error: 'Job not found',
        };
      }

      const state = await job.getState();
      
      if (state !== 'completed') {
        return {
          taskId: jobId,
          status: state,
          message: 'Scan is not completed yet',
        };
      }

      return {
        taskId: jobId,
        status: 'completed',
        data: job.returnvalue,
      };
    } catch (error) {
      this.logger.error(`Error getting scan result for job ${jobId}:`, error);
      return {
        taskId: jobId,
        status: 'error',
        error: error.message,
      };
    }
  }

  @Post('cancel/:jobId')
  @ApiOperation({
    summary: 'Cancel a scan task',
    description: 'Cancels and removes a scan task from the queue',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Unique identifier of the scan job to cancel',
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'Scan task cancelled successfully',
    type: ScanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async cancelScan(@Param('jobId') jobId: string): Promise<ScanResponseDto> {
    try {
      const job = await this.scanQueue.getJob(jobId);
      
      if (!job) {
        return {
          taskId: jobId,
          status: 'not_found',
          error: 'Job not found',
        };
      }

      await job.remove();
      
      this.logger.log(`Cancelled scan job: ${jobId}`);

      return {
        taskId: jobId,
        status: 'cancelled',
        message: 'Scan task cancelled successfully',
      };
    } catch (error) {
      this.logger.error(`Error cancelling scan job ${jobId}:`, error);
      return {
        taskId: jobId,
        status: 'error',
        error: error.message,
      };
    }
  }

  @Get('queue/stats')
  @ApiOperation({
    summary: 'Get queue statistics',
    description: 'Retrieves statistics about the scan queue including counts of waiting, active, completed, and failed jobs',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        waiting: { type: 'number', example: 5 },
        active: { type: 'number', example: 2 },
        completed: { type: 'number', example: 100 },
        failed: { type: 'number', example: 3 },
        total: { type: 'number', example: 110 },
      },
    },
  })
  async getQueueStats(): Promise<any> {
    try {
      const waiting = await this.scanQueue.getWaiting();
      const active = await this.scanQueue.getActive();
      const completed = await this.scanQueue.getCompleted();
      const failed = await this.scanQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length,
      };
    } catch (error) {
      this.logger.error('Error getting queue stats:', error);
      throw error;
    }
  }

  @Get('queue/jobs')
  @ApiOperation({
    summary: 'Get queue jobs',
    description: 'Retrieves a list of jobs from the scan queue with optional filtering by status',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter jobs by status',
    required: false,
    enum: ['waiting', 'active', 'completed', 'failed'],
    example: 'active',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of jobs to return',
    required: false,
    type: 'string',
    example: '10',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue jobs retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '12345' },
          name: { type: 'string', example: 'scan-task' },
          data: { type: 'object' },
          progress: { type: 'number', example: 75 },
          state: { type: 'string', example: 'active' },
          createdAt: { type: 'number', example: 1640995200000 },
          processedOn: { type: 'number', example: 1640995205000 },
          finishedOn: { type: 'number', example: 1640995210000 },
        },
      },
    },
  })
  async getQueueJobs(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 10;
      let jobs: any[] = [];

      switch (status) {
        case 'waiting':
          jobs = await this.scanQueue.getWaiting(0, limitNum - 1);
          break;
        case 'active':
          jobs = await this.scanQueue.getActive(0, limitNum - 1);
          break;
        case 'completed':
          jobs = await this.scanQueue.getCompleted(0, limitNum - 1);
          break;
        case 'failed':
          jobs = await this.scanQueue.getFailed(0, limitNum - 1);
          break;
        default:
          const allJobs = await Promise.all([
            this.scanQueue.getWaiting(0, Math.floor(limitNum / 4)),
            this.scanQueue.getActive(0, Math.floor(limitNum / 4)),
            this.scanQueue.getCompleted(0, Math.floor(limitNum / 4)),
            this.scanQueue.getFailed(0, Math.floor(limitNum / 4)),
          ]);
          jobs = allJobs.flat();
      }

      return jobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        state: job.state,
        createdAt: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      }));
    } catch (error) {
      this.logger.error('Error getting queue jobs:', error);
      throw error;
    }
  }
}
