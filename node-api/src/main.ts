import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {config} from 'dotenv';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Config
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('app.corsOrigin', '*');
  const port = configService.get<number>('app.port', 3000);

  // Enable CORS
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('SQLMap BullMQ Proxy API')
    .setDescription('A NestJS-based BullMQ proxy that accepts scan tasks and calls the SQLMap API for vulnerability scanning')
    .setVersion('1.0')
    .addTag('scan', 'Scan management operations')
    .addTag('queue', 'Queue management operations')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.example.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    customSiteTitle: 'SQLMap BullMQ Proxy API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6; }
    `,
  });

  await app.listen(port);
  
  console.log(`🚀 SQLMap BullMQ Proxy is running on port ${port}`);
  const redisHost = configService.get<string>('redis.host', 'localhost');
  const redisPort = configService.get<number>('redis.port', 6379);
  const sqlmapApi = configService.get<string>('sqlmap.apiUrl', 'http://localhost:8775');
  console.log(`📊 Redis connection: ${redisHost}:${redisPort}`);
  console.log(`🔗 SQLMap API: ${sqlmapApi}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
