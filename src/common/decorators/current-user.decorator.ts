import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export interface JwtUser {
  id: string;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext): JwtUser | JwtUser[keyof JwtUser] => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtUser }>();
    const user = request.user;
    return data ? user[data] : user;
  },
);
