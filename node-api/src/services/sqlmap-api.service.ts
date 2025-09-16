import { Injectable, Logger, Inject } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import sqlmapConfig from '../config/sqlmap.config';
import { ScanTaskDto, ScanResponseDto } from '../dto/scan-task.dto';

@Injectable()
export class SqlmapApiService {
  private readonly logger = new Logger(SqlmapApiService.name);
  private readonly baseUrl: string;

  constructor(
    @Inject(sqlmapConfig.KEY)
    private readonly cfg: ConfigType<typeof sqlmapConfig>,
  ) {
    this.baseUrl = cfg.apiUrl;
  }

  async createTask(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/task/new`);
      const data = await response.json();
      
      if (data.taskid) {
        this.logger.log(`Created new task: ${data.taskid}`);
        return data.taskid;
      }
      
      throw new Error('Failed to create task');
    } catch (error) {
      this.logger.error('Error creating task:', error);
      throw error;
    }
  }

  async setTaskOptions(taskId: string, options: ScanTaskDto): Promise<void> {
    try {
      const optionData = this.buildOptionData(options);
      
      // Filter out undefined and null values
      const filteredOptions = Object.fromEntries(
        Object.entries(optionData).filter(([_, value]) => value !== undefined && value !== null)
      );
      
      if (Object.keys(filteredOptions).length === 0) {
        this.logger.log(`No options to set for task ${taskId}`);
        return;
      }

      const response = await fetch(`${this.baseUrl}/option/${taskId}/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filteredOptions),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to set options: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(`Failed to set options: ${result.message || 'Unknown error'}`);
      }
      
      this.logger.log(`Set options for task ${taskId}: ${Object.keys(filteredOptions).join(', ')}`);
    } catch (error) {
      this.logger.error(`Error setting options for task ${taskId}:`, error);
      throw error;
    }
  }

  async startScan(taskId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/scan/${taskId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Send empty JSON object as required by the API
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start scan: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`Failed to start scan: ${result.message || 'Unknown error'}`);
      }

      this.logger.log(`Started scan for task ${taskId}`);
    } catch (error) {
      this.logger.error(`Error starting scan for task ${taskId}:`, error);
      throw error;
    }
  }

  async getScanStatus(taskId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/scan/${taskId}/status`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get scan status: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Error getting scan status for task ${taskId}:`, error);
      throw error;
    }
  }

  async getScanData(taskId: string): Promise<ScanResponseDto> {
    try {
      const response = await fetch(`${this.baseUrl}/scan/${taskId}/data`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get scan data: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Error getting scan data for task ${taskId}:`, error);
      throw error;
    }
  }

  async getScanLog(taskId: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/scan/${taskId}/log`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get scan log: ${response.statusText}`);
      }

      return data.log || [];
    } catch (error) {
      this.logger.error(`Error getting scan log for task ${taskId}:`, error);
      throw error;
    }
  }

  async stopScan(taskId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/scan/${taskId}/stop`);
      
      if (!response.ok) {
        throw new Error(`Failed to stop scan: ${response.statusText}`);
      }

      this.logger.log(`Stopped scan for task ${taskId}`);
    } catch (error) {
      this.logger.error(`Error stopping scan for task ${taskId}:`, error);
      throw error;
    }
  }

  async killScan(taskId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/scan/${taskId}/kill`);
      
      if (!response.ok) {
        throw new Error(`Failed to kill scan: ${response.statusText}`);
      }

      this.logger.log(`Killed scan for task ${taskId}`);
    } catch (error) {
      this.logger.error(`Error killing scan for task ${taskId}:`, error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/task/${taskId}/delete`);
      
      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
      }

      this.logger.log(`Deleted task ${taskId}`);
    } catch (error) {
      this.logger.error(`Error deleting task ${taskId}:`, error);
      throw error;
    }
  }

  private buildOptionData(options: ScanTaskDto): Record<string, any> {
    const optionData: Record<string, any> = {};

    // Map DTO properties to SQLMap option names with proper type conversion
    if (options.target) optionData.url = options.target;
    if (options.method) optionData.method = options.method;
    if (options.data) optionData.data = options.data;
    if (options.cookie) optionData.cookie = options.cookie;
    if (options.userAgent) optionData.userAgent = options.userAgent;
    if (options.referer) optionData.referer = options.referer;
    if (options.headers) optionData.headers = options.headers.join('\n');
    if (options.proxy) optionData.proxy = options.proxy;
    if (options.proxyCred) optionData.proxyCred = options.proxyCred;
    if (options.proxyFile) optionData.proxyFile = options.proxyFile;
    
    // Boolean options
    if (options.tor !== undefined) optionData.tor = this.convertToBoolean(options.tor);
    if (options.checkTor !== undefined) optionData.checkTor = this.convertToBoolean(options.checkTor);
    if (options.skipUrlEncode !== undefined) optionData.skipUrlEncode = this.convertToBoolean(options.skipUrlEncode);
    if (options.forceSsl !== undefined) optionData.forceSsl = this.convertToBoolean(options.forceSsl);
    if (options.chunked !== undefined) optionData.chunked = this.convertToBoolean(options.chunked);
    if (options.hpp !== undefined) optionData.hpp = this.convertToBoolean(options.hpp);
    
    // String options
    if (options.torPort) optionData.torPort = options.torPort;
    if (options.torType) optionData.torType = options.torType;
    if (options.randomize) optionData.randomize = options.randomize;
    if (options.safeUrl) optionData.safeUrl = options.safeUrl;
    if (options.safePost) optionData.safePost = options.safePost;
    if (options.safeReqFile) optionData.safeReqFile = options.safeReqFile;
    if (options.csrfToken) optionData.csrfToken = options.csrfToken;
    if (options.csrfUrl) optionData.csrfUrl = options.csrfUrl;
    if (options.csrfMethod) optionData.csrfMethod = options.csrfMethod;
    if (options.eval) optionData.eval = options.eval;
    
    // Numeric options
    if (options.delay !== undefined) optionData.delay = this.convertToNumber(options.delay);
    if (options.timeout !== undefined) optionData.timeout = this.convertToNumber(options.timeout);
    if (options.retries !== undefined) optionData.retries = this.convertToNumber(options.retries);
    if (options.safeFreq !== undefined) optionData.safeFreq = this.convertToNumber(options.safeFreq);

    // Add custom options
    if (options.customOptions) {
      Object.assign(optionData, options.customOptions);
    }

    return optionData;
  }

  private convertToBoolean(value: string | boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
    }
    return false;
  }

  private convertToNumber(value: string | number): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
}
