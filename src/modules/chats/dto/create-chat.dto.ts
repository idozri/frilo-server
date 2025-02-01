/** @format */

import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateChatDto {
  @ApiProperty({ example: ["user1Id", "user2Id"] })
  @IsArray()
  @IsString({ each: true })
  participants: string[];

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  isGroupChat?: boolean;

  @ApiProperty({ example: "Group Name" })
  @IsString()
  @IsOptional()
  groupName?: string;

  @ApiProperty({ example: "https://example.com/avatar.jpg" })
  @IsString()
  @IsOptional()
  groupAvatar?: string;

  @ApiProperty({ example: "marker123" })
  @IsString()
  @IsOptional()
  markerId?: string;
}
