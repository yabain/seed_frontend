import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChild,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ADMIN_ROLES, type UserRole } from '../constants/roles';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivateChild {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  canActivateChild(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.authService.ensureSession().pipe(
      map((isAuthenticated) => {
        if (!isAuthenticated) {
          return this.router.createUrlTree(['/admin/login'], {
            queryParams: { redirect: this.router.url },
          });
        }

        const required =
          (route.data['roles'] as readonly UserRole[] | undefined) ?? [
            ...ADMIN_ROLES,
          ];
        if ((required as readonly string[]).includes('*')) {
          return true;
        }

        const role = (this.authService.admin()?.role ?? '') as string;
        if ((required as readonly string[]).includes(role)) {
          return true;
        }

        return this.router.createUrlTree(['/admin/news']);
      }),
    );
  }
}
