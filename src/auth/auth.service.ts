import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as speakeasy from 'speakeasy';
import * as jwt from 'jsonwebtoken';
import { User } from '../model/user';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { UserService } from '../user/user.service';
import * as dotenv from 'dotenv';
import { CreateUserDto } from '../user/dto/create-user.dto';

dotenv.config();

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}
  async validateUser(
    username: string,
    password: string,
  ): Promise<boolean | User> {
    try {
      const user = await this.userService.findOneByUsername(username);
      if (
        user &&
        (await this.userService.comparePasswords(password, user.password))
      ) {
        return user;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  validateUserById(id: string): any {
    return this.userService.findOneById(id);
  }

  validateUserByUsername(username: string): any {
    return this.userService.findOneByUsername(username);
  }

  generateTwoFactorSecret(): string {
    const secret = speakeasy.generateSecret({ length: 20 });
    return secret.otpauth_url;
  }

  async login({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<{ user: any; token: string }> {
    const user = await this.validateUser(username, password);
    if (user) {
      const token = await this.generateJwtToken(user);
      return { user, token };
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async register(createUserDto: CreateUserDto): Promise<any> {
    const existingUser = await this.userService.findOneByUsername(
      createUserDto.username,
    );
    if (existingUser) {
      throw new BadRequestException('Username is already taken');
    }
    const user = await this.userService.create(createUserDto);
    return user;
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const decodedToken: any = jwt.verify(
        token,
        process.env.EMAIL_VERIFICATION_SECRET,
      );
      const userId = decodedToken.sub;
      await this.userService.verifyEmail(userId);
    } catch (error) {
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  async sendResetPasswordEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${resetPasswordLink}`,
    };
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new BadRequestException('Error sending password reset email');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userService.findOneByUsername(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const resetToken = await this.generateResetPasswordToken(user.id);
    this.sendResetPasswordEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decodedToken: any = jwt.verify(
        token,
        process.env.RESET_PASSWORD_SECRET,
      );

      // Check if the token has expired
      if (decodedToken.exp && Date.now() >= decodedToken.exp * 1000) {
        throw new BadRequestException('Reset password token has expired');
      }

      const userId = decodedToken.sub;
      await this.userService.updatePassword(userId, newPassword);
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset password token');
    }
  }

  private async generateJwtToken(user: any): Promise<string> {
    const payload = { username: user.username, sub: user.userId };
    const secretKey = process.env.JWT_SECRET_KEY || 'default-secret-key';
    const expiresIn = '3h';
    return jwt.sign(payload, secretKey, { expiresIn });
  }

  private async generateResetPasswordToken(userId: string): Promise<string> {
    const secretKey =
      process.env.RESET_PASSWORD_SECRET || 'default-reset-password-secret';
    const expiresIn = '1h';
    return jwt.sign({ sub: userId }, secretKey, { expiresIn });
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    const existingUser = await this.userService.findOneById(id);
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    Object.assign(existingUser, updateUserDto);
    return this.userService.update(id, existingUser);
  }

  verifyTwoFactorToken(secret: string, token: string): boolean {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
    });
    return verified;
  }
}
