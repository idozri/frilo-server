/** @format */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY'
        ),
      },
    });
    this.bucket = this.configService.get<string>('AWS_BUCKET_NAME');
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string
  ): Promise<{ url: string }> {
    const key = `${folder}/${Date.now()}-${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: 'inline',
      Metadata: {
        'x-amz-meta-orientation': 'original',
      },
      CacheControl: 'public, max-age=31536000',
    });

    await this.s3Client.send(command);
    return {
      url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
    };
  }

  async uploadFiles(uris: string[], folder: string): Promise<string[]> {
    try {
      const base64Files = await Promise.all(
        uris.map((uri) => this.base64ToFile(uri))
      );

      const uploadPromises = base64Files.map((file) =>
        this.uploadFile(file, folder)
      );

      const results = await Promise.all(uploadPromises);

      return results.map((result) => result.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }

  async base64ToFile(uri: string): Promise<Express.Multer.File> {
    if (!uri) {
      console.error('Received empty URI');
      return null;
    }

    if (!uri.includes('base64')) {
      console.error(
        'URI is not in base64 format:',
        uri.substring(0, 50) + '...'
      );
      return null;
    }

    // Extract the base64 data from the data URI
    const [header, base64Data] = uri.split(',');
    if (!base64Data) {
      console.error('Could not extract base64 data from URI:', header);
      return null;
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Get mime type from the header
    const mimeType = header.split(';')[0].split(':')[1] || 'image/jpeg';

    // Preserve original filename if it exists in the data URI
    const originalName =
      header.match(/name=(.*?)(;|$)/)?.[1] ||
      `image-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;

    const file = {
      buffer,
      originalname: originalName,
      mimetype: mimeType,
    } as Express.Multer.File;

    return file;
  }

  async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error(`Error deleting file ${key}:`, error);
      throw error;
    }
  }

  async deleteFolder(folderPath: string): Promise<void> {
    try {
      // List all objects in the folder
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: folderPath,
      });

      const listedObjects = await this.s3Client.send(listCommand);

      if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
        console.log(`No objects found in folder ${folderPath}`);
        return;
      }

      // Create delete command for all objects
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
          Quiet: false,
        },
      });

      // Delete all objects in the folder
      const deletedObjects = await this.s3Client.send(deleteCommand);

      if (deletedObjects.Errors?.length > 0) {
        console.error('Errors during bulk delete:', deletedObjects.Errors);
        throw new Error('Some objects could not be deleted');
      }

      console.log(
        `Successfully deleted folder ${folderPath} and all its contents`
      );
    } catch (error) {
      console.error(`Error deleting folder ${folderPath}:`, error);
      throw error;
    }
  }

  getFileUrl(key: string): string {
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}
