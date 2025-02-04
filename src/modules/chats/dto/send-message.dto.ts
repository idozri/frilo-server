/** @format */

import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
}

export class SendMessageDto {
  @ApiProperty({ example: 'chat123' })
  @IsString()
  chatId: string;

  @ApiProperty({ example: 'Hello world!' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ enum: MessageType })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ example: ['https://example.com/image.jpg'] })
  @IsArray()
  @IsOptional()
  mediaUrls?: string[];

  @ApiProperty({ example: 'message123' })
  @IsString()
  @IsOptional()
  replyToMessageId?: string;

  @ApiProperty({ example: [0.5, 0.8, 0.3] })
  @IsArray()
  @IsOptional()
  audioMetering?: number[];
}
