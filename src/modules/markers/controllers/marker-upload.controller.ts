/** @format */

import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { S3Service } from '../../s3/s3.service';
import { FileUploadController } from '../../../common/controllers/file-upload.controller';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileUploadInterceptor } from '../../../common/interceptors/file-upload.interceptor';

@ApiTags('markers')
@Controller('markers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MarkerUploadController extends FileUploadController {
  constructor(s3Service: S3Service) {
    super(
      s3Service,
      'markers',
      ['image/jpeg', 'image/png', 'image/webp'],
      10 * 1024 * 1024 // 10MB limit for marker images
    );
  }

  @UseInterceptors(
    FileUploadInterceptor(
      ['image/jpeg', 'image/png', 'image/webp'],
      10 * 1024 * 1024
    )
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return super.uploadFile(file);
  }
}
