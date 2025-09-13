import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 SQLMap BullMQ Proxy is running on port ${port}`);
  console.log(`📊 Redis connection: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
  console.log(`🔗 SQLMap API: ${process.env.SQLMAP_API_URL || 'http://localhost:8775'}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
