import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedActor } from '../types/authenticated-actor';

/**
 * Extracts the authenticated user from the request object.
 * Usage: @CurrentUser() user: UserPayload
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedActor | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedActor | undefined;
    return data ? user?.[data] : user;
  },
);
