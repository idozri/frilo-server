import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyUserDto {
  @IsString()
  @IsNotEmpty()
  token: string;
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
