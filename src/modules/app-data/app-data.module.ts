/** @format */

import { Module } from '@nestjs/common';
import { AppDataController } from './app-data.controller';
import { AppDataService } from './app-data.service';
import { UsersModule } from '../users/users.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { MarkersModule } from '../markers/markers.module';
import { CategoriesModule } from '../categories/categories.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatsModule } from '../chats/chats.module';

@Module({
  imports: [
    UsersModule,
    AchievementsModule,
    MarkersModule,
    CategoriesModule,
    NotificationsModule,
    ChatsModule,
  ],
  controllers: [AppDataController],
  providers: [AppDataService],
})
export class AppDataModule {}
