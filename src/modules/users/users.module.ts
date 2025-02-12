/** @format */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './entities/user.entity';
import { S3Module } from '../s3/s3.module';
import { UserUploadController } from './controllers/user-upload.controller';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    S3Module,
    PassportModule,
  ],
  controllers: [UsersController, UserUploadController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
