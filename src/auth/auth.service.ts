import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
              constructor(
                            private readonly jwtService: JwtService,
              ) { }

              generateToken(user: any) {

                            const payload = {
                                          sub: user.id,
                                          email: user.email,
                                          role: user.role,
                            };

                            return {
                                          access_token: this.jwtService.sign(payload),
                            };
              }
}
