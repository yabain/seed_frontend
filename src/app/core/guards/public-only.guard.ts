import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class PublicOnlyGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/admin/dashboard']);
    }
    return true;
  }
}
