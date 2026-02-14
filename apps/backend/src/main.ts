import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  // Validate environment variables first
  validateEnv();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until logger is ready
  });

  // Use Pino logger
  app.useLogger(app.get(Logger));

  // Security middleware
  app.use(helmet());

  // Response compression
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses > 1KB
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
    credentials: true,
  });

  // Global validation pipe (enhanced with sanitization)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert string to number automatically
      },
    }),
  );

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('School Tiffin API')
    .setDescription('API documentation for School Tiffin Platform')
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Health', 'Health check endpoints')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'School Tiffin API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('');
  console.log('🚀 ====================================');
  console.log(`🎉 Server is running!`);
  console.log('🚀 ====================================');
  console.log('');
  console.log(`📍 Local:            http://localhost:${port}`);
  console.log(`📚 API Docs:         http://localhost:${port}/api/docs`);
  console.log(`🏥 Health Check:     http://localhost:${port}/health`);
  console.log(`🔐 Auth Endpoint:    http://localhost:${port}/v1/auth`);
  console.log('');
  console.log(`🌍 Environment:      ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 API Version:      v1`);
  console.log('');
  console.log('🛡️  Security Features:');
  console.log('  ✅ Rate Limiting');
  console.log('  ✅ Input Sanitization');
  console.log('  ✅ JWT Authentication');
  console.log('  ✅ Helmet (Security Headers)');
  console.log('  ✅ Response Compression');
  console.log('');
}

bootstrap();
