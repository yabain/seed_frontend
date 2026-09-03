import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, map, tap, catchError, shareReplay } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import { isAdminRole } from '../constants/roles';
import type {
  Admin,
  AdminProfile,
  RequiresTwoFactorResponse,
  TwoFactorVerifyResponse,
  SendTwoFactorCodeResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from '../models/models';

/**
 * Service d'authentification.
 *
 * Le jeton JWT est stocké côté serveur dans un cookie HttpOnly (inaccessible au
 * JavaScript), ce qui réduit l'exposition en cas de XSS.
 *
 * L'état d'authentification et le rôle ne proviennent PAS du stockage local
 * modifiable (localStorage) mais sont confirmés auprès du serveur via `GET
 * /admin/auth/me` au démarrage de l'application (voir `ensureSession`).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly adminSignal = signal<Admin | null>(null);
  private readonly authenticatedSignal = signal(false);
  private ready = false;

  readonly admin = this.adminSignal.asReadonly();
  readonly isAuthenticated = this.authenticatedSignal.asReadonly();
  readonly isAdmin = computed(() => isAdminRole(this.adminSignal()?.role));

  private readonly session$: Observable<boolean>;

  constructor(private readonly api: ApiGatewayService) {
    this.session$ = this.getProfile().pipe(
      tap({
        next: (profile) => {
          this.applyProfile(profile);
          this.authenticatedSignal.set(true);
        },
        error: () => {
          this.adminSignal.set(null);
          this.authenticatedSignal.set(false);
        },
        finalize: () => {
          this.ready = true;
        },
      }),
      map(() => this.authenticatedSignal()),
      shareReplay(1),
    );
  }

  /** Retourne l'état d'authentification confirmé auprès du serveur. */
  ensureSession(): Observable<boolean> {
    if (this.ready) {
      return of(this.authenticatedSignal());
    }
    return this.session$;
  }

  private applyProfile(profile: AdminProfile | Admin): void {
    this.adminSignal.set({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      phone: profile.phone,
      avatar: profile.avatar,
    });
  }

  login(
    email: string,
    password: string,
  ): Observable<RequiresTwoFactorResponse> {
    return this.api.post<RequiresTwoFactorResponse>(
      '/admin/auth/login',
      { email, password },
    );
  }

  sendTwoFactorCode(email: string): Observable<SendTwoFactorCodeResponse> {
    return this.api.post<SendTwoFactorCodeResponse>(
      '/admin/auth/2fa/send-code',
      { email },
    );
  }

  verifyTwoFactor(email: string, code: string): Observable<TwoFactorVerifyResponse> {
    return this.api
      .post<TwoFactorVerifyResponse>('/admin/auth/2fa/verify', { email, code })
      .pipe(
        tap((response) => {
          this.applyProfile(response.admin);
          this.authenticatedSignal.set(true);
          this.ready = true;
        }),
      );
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.api.post<ForgotPasswordResponse>(
      '/admin/auth/forgot-password',
      { email },
    );
  }

  resetPassword(token: string, password: string): Observable<ResetPasswordResponse> {
    return this.api.post<ResetPasswordResponse>('/admin/auth/reset-password', {
      token,
      password,
    });
  }

  getProfile(): Observable<AdminProfile> {
    return this.api.get<AdminProfile>('/admin/auth/me');
  }

  refreshProfile(): Observable<AdminProfile> {
    return this.getProfile().pipe(tap((profile) => this.applyProfile(profile)));
  }

  updateProfile(data: {
    name?: string;
    phone?: string;
    avatar?: string;
  }): Observable<{ updated: boolean; admin: AdminProfile }> {
    return this.api
      .patch<{ updated: boolean; admin: AdminProfile }>('/admin/auth/me', data)
      .pipe(tap((response) => this.applyProfile(response.admin)));
  }

  /** Efface uniquement l'état local (sans appeler le backend). Utilisé en cas de 401. */
  clearLocalSession(): void {
    this.adminSignal.set(null);
    this.authenticatedSignal.set(false);
    this.ready = true;
  }

  logout(): Observable<{ success: boolean }> {
    return this.api.post<{ success: boolean }>('/admin/auth/logout').pipe(
      tap(() => {
        this.adminSignal.set(null);
        this.authenticatedSignal.set(false);
        this.ready = true;
      }),
      catchError(() => {
        this.adminSignal.set(null);
        this.authenticatedSignal.set(false);
        this.ready = true;
        return of({ success: false });
      }),
    );
  }
}
