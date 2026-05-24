// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy, VerifyCallback } from 'passport-google-oauth20';
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {

//               constructor(private configService: ConfigService) {
//                             super({
//                                           clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
//                                           clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
//                                           callbackURL: 'http://localhost:3000/auth/google/callback',
//                                           scope: ['email', 'profile'],
//                             });
//               }

//               async validate(
//                             accessToken: string,
//                             refreshToken: string,
//                             profile: any,
//                             done: VerifyCallback,
//               ): Promise<any> {

//                             const { name, emails, photos, id } = profile;

//                             const user = {
//                                           email: emails[0].value,
//                                           firstName: name.givenName,
//                                           lastName: name.familyName,
//                                           picture: photos[0].value,
//                                           googleId: id,
//                             };

//                             done(null, user);
//               }
// }

import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from '../user/entity/user.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {

              constructor(
                            private configService: ConfigService,

                            @InjectRepository(User)
                            private readonly userRepository: Repository<User>,
              ) {

                            super({
                                          clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
                                          clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
                                          callbackURL: 'http://localhost:3000/auth/google/callback',
                                          scope: ['email', 'profile'],
                            });
              }

              async validate(
                            accessToken: string,
                            refreshToken: string,
                            profile: any,
                            done: VerifyCallback,
              ): Promise<any> {

                            const { name, emails, photos, id } = profile;

                            const email = emails[0].value;

                            // check existing user
                            let user = await this.userRepository.findOne({
                                          where: { email },
                            });

                            // create new user if not exists
                            if (!user) {

                                          user = this.userRepository.create({
                                                        name: name.givenName,
                                                        email: email,
                                                        googleId: id,
                                                        picture: photos[0].value,
                                                        provider: 'google',
                                                        role: UserRole.USER,
                                          });

                                          await this.userRepository.save(user);
                            }

                            done(null, user);
              }
}