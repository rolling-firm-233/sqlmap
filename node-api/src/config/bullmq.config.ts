import { registerAs } from '@nestjs/config';

// Read once at module load so it can be used in decorators too
export const BULLMQ_QUEUE_NAME = process.env.BULLMQ_QUEUE_NAME ?? 'sqlmap-queue';

export default registerAs('bullmq', () => ({
  queueName: BULLMQ_QUEUE_NAME,
}));


