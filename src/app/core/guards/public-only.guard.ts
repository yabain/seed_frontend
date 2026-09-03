import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class PublicOnlyGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.ensureSession().pipe(
      map((isAuthenticated) => {
        if (isAuthenticated) {
          return this.router.createUrlTree(['/admin/dashboard']);
        }
        return true;
      }),
    );
  }
}
