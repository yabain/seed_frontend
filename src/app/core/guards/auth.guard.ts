import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.ensureSession().pipe(
      map((isAuthenticated) => {
        if (isAuthenticated) {
          return true;
        }
        return this.router.createUrlTree(['/admin/login'], {
          queryParams: { redirect: this.router.url },
        });
      }),
    );
  }
}
