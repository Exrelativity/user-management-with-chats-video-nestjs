import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  NotFoundException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { LoginUserDto } from './dto/login-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto'; // Create a specific DTO for reset password
import { LocalAuthGuard } from './local-auth.guard';
import { ResetPasswordValidateDto } from './dto/reset-password-validate.dto';
import { User } from 'src/model/user';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
  })
  @ApiBody({ type: LoginUserDto })
  async login(@Body() loginUserDto: LoginUserDto) {
    const userLogin = await this.authService.login(loginUserDto);
    return { status: HttpStatus.OK, message: 'Login successful', ...userLogin };
  }

  @Post('register')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: User,
  })
  @ApiBody({ type: CreateUserDto })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    return {
      status: HttpStatus.CREATED,
      user: user,
      message: 'User registered successfully',
    };
  }

  @Get('verify-email/:token')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  @ApiParam({ name: 'token', description: 'Verification token' })
  async verifyEmail(@Param('token') token: string) {
    try {
      await this.authService.verifyEmail(token);
      return { status: HttpStatus.OK, message: 'Email verified successfully' };
    } catch (error) {
      throw new NotFoundException('Invalid or expired verification token');
    }
  }

  @Post('reset-password')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent successfully',
  })
  @ApiBody({ type: ResetPasswordDto })
  async requestPasswordReset(@Body() body: ResetPasswordDto) {
    await this.authService.requestPasswordReset(body.email);
    return {
      status: HttpStatus.OK,
      message: 'Password reset email sent successfully',
    };
  }

  @Post('reset-password/:token')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  @ApiParam({ name: 'token', description: 'Reset password token' })
  @ApiBody({ type: ResetPasswordValidateDto })
  async resetPassword(
    @Param('token') token: string,
    @Body() body: ResetPasswordValidateDto,
  ) {
    try {
      await this.authService.resetPassword(token, body.newPassword);
      return { status: HttpStatus.OK, message: 'Password reset successfully' };
    } catch (error) {
      throw new NotFoundException('Invalid or expired reset password token');
    }
  }
}
