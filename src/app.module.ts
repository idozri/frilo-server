/** @format */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatsModule } from './modules/chats/chats.module';
import { MarkersModule } from './modules/markers/markers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { S3Module } from './modules/s3/s3.module';
import { GoogleModule } from './modules/google/google.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { DataInitModule } from './services/data-init.module';
import configuration from './config/configuration';
import { PassportModule } from '@nestjs/passport';
import { AppDataModule } from './modules/app-data/app-data.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        retryWrites: true,
        tls: true,
        tlsAllowInvalidCertificates: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ChatsModule,
    MarkersModule,
    CategoriesModule,
    S3Module,
    GoogleModule,
    NotificationsModule,
    WebsocketModule,
    AnalyticsModule,
    AchievementsModule,
    ReactionsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DataInitModule,
    AppDataModule,
  ],
})
export class AppModule {}
