import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract tenant_id from the authenticated user's JWT payload.
 * Usage: @TenantId() tenantId: string
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId;
  },
);

/**
 * Extract full user from JWT payload.
 * Usage: @CurrentUser() user: JwtPayload
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
