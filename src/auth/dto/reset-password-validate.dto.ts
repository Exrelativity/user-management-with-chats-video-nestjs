import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordValidateDto {
  @IsNotEmpty()
  @MinLength(6)
  @IsString()
  @ApiProperty()
  newPassword: string;
}
