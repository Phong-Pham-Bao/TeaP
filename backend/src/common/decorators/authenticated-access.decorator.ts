import { SetMetadata } from '@nestjs/common';

export const AUTHENTICATED_ACCESS_KEY = 'authenticatedAccess';

/**
 * Explicitly marks a route as available to every authenticated role.
 *
 * Routes without @Public(), @Roles(), or @AuthenticatedAccess() are denied by
 * RolesGuard so a newly-added endpoint cannot accidentally become available.
 */
export const AuthenticatedAccess = () =>
  SetMetadata(AUTHENTICATED_ACCESS_KEY, true);
