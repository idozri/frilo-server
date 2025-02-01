/** @format */

import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { MessageType } from "../entities/message.entity";

export class CreateMessageDto {
  @ApiProperty({ example: "chat123" })
  @IsString()
  chatId: string;

  @ApiProperty({ example: "Hello world!" })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({
    enum: ["text", "image", "audio", "video", "file"],
    example: "text",
  })
  @IsEnum(["text", "image", "audio", "video", "file"])
  @IsOptional()
  type?: MessageType;

  @ApiProperty({ example: ["https://example.com/image.jpg"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mediaUrls?: string[];

  @ApiProperty({ example: [0.5, 0.8, 0.3] })
  @IsArray()
  @IsOptional()
  audioMetering?: number[];

  @ApiProperty({ example: "message123" })
  @IsString()
  @IsOptional()
  replyToMessageId?: string;
}
