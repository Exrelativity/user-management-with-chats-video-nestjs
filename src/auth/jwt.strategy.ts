import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET_KEY || 'default-secret-key',
    });
  }

  async validate(payload: any): Promise<any> {
    console.log(payload);
    if (payload.exp < Date.now() / 1000) {
      throw new UnauthorizedException('Token has expired');
    }
    return this.authService.validateUserByUsername(payload.username);
  }
}
