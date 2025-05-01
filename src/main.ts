import cookieParser from 'cookie-parser';

// Set development environment if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataInitService } from './services/data-init.service';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure body parser limits
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // Initialize data if needed
  const dataInitService = app.get(DataInitService);
  await dataInitService.initializeData();

  // Enable CORS with development configuration
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  const port = process.env.PORT ?? 5000;
  const host = '0.0.0.0';

  await app.listen(port, host);
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${port}`
  );
}

bootstrap();
