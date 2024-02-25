import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  // IsString,
  // IsEmail,
  // MinLength,
  // MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  // @IsOptional()
  // @IsString()
  // @MinLength(3)
  // @MaxLength(30)
  // @ApiProperty()
  // username?: string;

  // @IsOptional()
  // @IsEmail()
  // @ApiProperty()
  // email?: string;

  @IsOptional()
  @ApiProperty()
  isEmailVerified?: boolean;

  // @IsOptional()
  // @MinLength(6)
  // @ApiProperty()
  // password?: string;
}
