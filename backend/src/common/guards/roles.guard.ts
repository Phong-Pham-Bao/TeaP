import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { AUTHENTICATED_ACCESS_KEY } from '../decorators/authenticated-access.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Permission, roleHasEveryPermission } from '../auth/permission-matrix';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      targets,
    );
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ...targets,
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      targets,
    );
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    if (requiredRoles?.length && requiredPermissions?.length) {
      throw new ForbiddenException(
        'Route cannot combine role and permission access policies',
      );
    }

    if (requiredPermissions?.length) {
      return roleHasEveryPermission(user.role, requiredPermissions);
    }

    const allowsAnyAuthenticated = this.reflector.getAllAndOverride<boolean>(
      AUTHENTICATED_ACCESS_KEY,
      targets,
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      if (allowsAnyAuthenticated) return true;
      throw new ForbiddenException('Route access policy is not configured');
    }

    // Legacy @Roles routes retain the explicit super-admin bypass while they
    // are migrated to the centralized permission matrix.
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}
