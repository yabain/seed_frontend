import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChild,
  Router,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

export const ADMIN_ROLES = ['admin', 'superadmin'] as const;
export const CONTENT_ROLES = ['user', 'consultant', 'admin', 'superadmin'] as const;

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivateChild {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  canActivateChild(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/admin/login'], {
        queryParams: { redirect: this.router.url },
      });
    }

    const required = (route.data['roles'] as readonly string[] | undefined) ?? [
      ...ADMIN_ROLES,
    ];
    if (required.includes('*')) {
      return true;
    }

    const role = this.authService.admin()?.role ?? '';
    if (required.includes(role)) {
      return true;
    }

    return this.router.createUrlTree(['/admin/news']);
  }
}
