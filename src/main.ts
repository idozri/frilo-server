/** @format */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataInitService } from './services/data-init.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialize data if needed
  const dataInitService = app.get(DataInitService);
  await dataInitService.initializeData();

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}

bootstrap();
