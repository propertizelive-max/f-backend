import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.cookies?.accessToken ?? null,
      ]),

      ignoreExpiration: false,

      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET_KEY!,
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
