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

@ApiTags('chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatUploadController extends FileUploadController {
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'application/pdf',
  ];
  private static readonly MAX_SIZE = 50 * 1024 * 1024; // 50MB

  constructor(s3Service: S3Service) {
    super(
      s3Service,
      'chats',
      ChatUploadController.ALLOWED_TYPES,
      ChatUploadController.MAX_SIZE
    );
  }

  @UseInterceptors(
    FileUploadInterceptor(
      ChatUploadController.ALLOWED_TYPES,
      ChatUploadController.MAX_SIZE
    )
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return super.uploadFile(file);
  }
}
