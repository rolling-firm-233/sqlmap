import { registerAs } from '@nestjs/config';

export default registerAs('sqlmap', () => ({
  apiUrl: process.env.SQLMAP_API_URL || 'http://localhost:8775',
}));


