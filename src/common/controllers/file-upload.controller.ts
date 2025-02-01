/** @format */

import {
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { S3Service } from '../../modules/s3/s3.service';
import { FileUploadInterceptor } from '../interceptors/file-upload.interceptor';

export abstract class FileUploadController {
  constructor(
    protected readonly s3Service: S3Service,
    protected readonly folder: string,
    protected readonly allowedMimeTypes: string[],
    protected readonly maxSize: number = 5 * 1024 * 1024
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully.',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the uploaded file',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @UseInterceptors(FileUploadInterceptor)
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.s3Service.uploadFile(file, this.folder);
      return result;
    } catch (error) {
      throw new BadRequestException('Failed to upload file');
    }
  }
}
