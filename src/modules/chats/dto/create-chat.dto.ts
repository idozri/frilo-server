/** @format */

import { IsArray, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group',
}

export class CreateChatDto {
  @ApiProperty({ example: ['user1Id', 'user2Id'] })
  @IsArray()
  @IsString({ each: true })
  participants: string[];

  @IsString()
  createdBy: string;

  @IsEnum(ChatType)
  type: ChatType;

  @ApiProperty({ example: 'Chat Title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Group Name' })
  @IsString()
  @IsOptional()
  groupName?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  groupAvatar?: string;

  @ApiProperty({ example: 'marker123' })
  @IsString()
  @IsOptional()
  markerId?: string;
}
