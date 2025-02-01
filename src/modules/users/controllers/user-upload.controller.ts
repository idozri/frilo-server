/** @format */

import {
  Controller,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { S3Service } from '../../s3/s3.service';
import { FileUploadController } from '../../../common/controllers/file-upload.controller';
import { FileUploadInterceptor } from '../../../common/interceptors/file-upload.interceptor';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserUploadController extends FileUploadController {
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  private static readonly MAX_SIZE = 2 * 1024 * 1024; // 2MB

  constructor(s3Service: S3Service) {
    super(
      s3Service,
      'avatars',
      UserUploadController.ALLOWED_TYPES,
      UserUploadController.MAX_SIZE
    );
  }

  @UseInterceptors(
    FileUploadInterceptor(
      UserUploadController.ALLOWED_TYPES,
      UserUploadController.MAX_SIZE
    )
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return super.uploadFile(file);
  }
}
