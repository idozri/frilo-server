/** @format */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import RequestUser from 'src/common/interfaces/request.user.interface';
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestUser;
  }
);
