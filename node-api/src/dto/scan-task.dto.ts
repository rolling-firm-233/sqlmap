import { IsString, IsOptional, IsObject, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScanTaskDto {
  @ApiProperty({
    description: 'Target URL to scan for SQL injection vulnerabilities',
    example: 'http://example.com/page.php?id=1',
  })
  @IsString()
  target: string;

  @ApiPropertyOptional({
    description: 'HTTP method to use for the request',
    example: 'GET',
    default: 'GET',
  })
  @IsOptional()
  @IsString()
  method?: string = 'GET';

  @ApiPropertyOptional({
    description: 'POST data to send with the request',
    example: 'param=value&another=test',
  })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiPropertyOptional({
    description: 'Cookie string to include in requests',
    example: 'session=abc123; user=john',
  })
  @IsOptional()
  @IsString()
  cookie?: string;

  @ApiPropertyOptional({
    description: 'User agent string to use in requests',
    example: 'Mozilla/5.0 (compatible; SQLMap BullMQ Proxy)',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Referer header value',
    example: 'http://example.com/',
  })
  @IsOptional()
  @IsString()
  referer?: string;

  @ApiPropertyOptional({
    description: 'Array of custom headers to include',
    example: ['X-Custom: value', 'Authorization: Bearer token'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  headers?: string[];

  @IsOptional()
  @IsString()
  proxy?: string;

  @IsOptional()
  @IsString()
  proxyCred?: string;

  @IsOptional()
  @IsString()
  proxyFile?: string;

  @IsOptional()
  @IsString()
  tor?: string;

  @IsOptional()
  @IsString()
  torPort?: string;

  @IsOptional()
  @IsString()
  torType?: string;

  @IsOptional()
  @IsString()
  checkTor?: string;

  @IsOptional()
  @IsString()
  delay?: string;

  @IsOptional()
  @IsString()
  timeout?: string;

  @IsOptional()
  @IsString()
  retries?: string;

  @IsOptional()
  @IsString()
  randomize?: string;

  @IsOptional()
  @IsString()
  safeUrl?: string;

  @IsOptional()
  @IsString()
  safePost?: string;

  @IsOptional()
  @IsString()
  safeReqFile?: string;

  @IsOptional()
  @IsString()
  safeFreq?: string;

  @IsOptional()
  @IsString()
  skipUrlEncode?: string;

  @IsOptional()
  @IsString()
  csrfToken?: string;

  @IsOptional()
  @IsString()
  csrfUrl?: string;

  @IsOptional()
  @IsString()
  csrfMethod?: string;

  @IsOptional()
  @IsString()
  forceSsl?: string;

  @IsOptional()
  @IsString()
  chunked?: string;

  @IsOptional()
  @IsString()
  hpp?: string;

  @IsOptional()
  @IsString()
  eval?: string;

  @IsOptional()
  @IsObject()
  customOptions?: Record<string, any>;
}

export class ScanResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the scan task',
    example: '12345',
  })
  @IsString()
  taskId: string;

  @ApiProperty({
    description: 'Current status of the scan task',
    example: 'completed',
    enum: ['queued', 'active', 'completed', 'failed', 'cancelled', 'not_found', 'error'],
  })
  @IsString()
  status: string;

  @ApiPropertyOptional({
    description: 'Human-readable message about the task status',
    example: 'Scan completed successfully',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description: 'Scan results or additional data',
    example: { vulnerabilities: [], log: ['Scan started', 'Scan completed'] },
  })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiPropertyOptional({
    description: 'Progress percentage (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  progress?: number;

  @ApiPropertyOptional({
    description: 'Error message if the task failed',
    example: 'Connection timeout',
  })
  @IsOptional()
  @IsString()
  error?: string;
}
