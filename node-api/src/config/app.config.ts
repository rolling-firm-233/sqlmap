import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '8776', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
}));


