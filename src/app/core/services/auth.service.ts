import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type {
  Admin,
  AdminProfile,
  LoginResponse,
  RequiresTwoFactorResponse,
  TwoFactorVerifyResponse,
  SendTwoFactorCodeResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from '../models/models';

const TOKEN_KEY = 'seed_token';
const ADMIN_KEY = 'seed_admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(null);
  private readonly adminSignal = signal<Admin | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly admin = this.adminSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  constructor(private readonly api: ApiGatewayService) {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      this.tokenSignal.set(storedToken);
    }
    const storedAdmin = localStorage.getItem(ADMIN_KEY);
    if (storedAdmin) {
      try {
        this.adminSignal.set(JSON.parse(storedAdmin) as Admin);
      } catch {
        localStorage.removeItem(ADMIN_KEY);
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse | RequiresTwoFactorResponse> {
    return this.api.post<LoginResponse | RequiresTwoFactorResponse>('/admin/auth/login', { email, password }).pipe(
      tap((response) => {
        if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
          return;
        }
        const loginResponse = response as LoginResponse;
        this.tokenSignal.set(loginResponse.accessToken);
        this.adminSignal.set(loginResponse.admin);
        localStorage.setItem(TOKEN_KEY, loginResponse.accessToken);
        localStorage.setItem(ADMIN_KEY, JSON.stringify(loginResponse.admin));
      }),
    );
  }

  sendTwoFactorCode(email: string): Observable<SendTwoFactorCodeResponse> {
    return this.api.post<SendTwoFactorCodeResponse>('/admin/auth/2fa/send-code', { email });
  }

  verifyTwoFactor(email: string, code: string): Observable<TwoFactorVerifyResponse> {
    return this.api.post<TwoFactorVerifyResponse>('/admin/auth/2fa/verify', { email, code }).pipe(
      tap((response) => {
        this.tokenSignal.set(response.accessToken);
        this.adminSignal.set(response.admin);
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        localStorage.setItem(ADMIN_KEY, JSON.stringify(response.admin));
      }),
    );
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.api.post<ForgotPasswordResponse>('/admin/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string): Observable<ResetPasswordResponse> {
    return this.api.post<ResetPasswordResponse>('/admin/auth/reset-password', { token, password });
  }

  getProfile(): Observable<AdminProfile> {
    return this.api.get<AdminProfile>('/admin/auth/me');
  }

  refreshProfile(): Observable<AdminProfile> {
    return this.getProfile().pipe(tap((profile) => this.setAdmin(profile)));
  }

  updateProfile(data: { name?: string; phone?: string; avatar?: string }): Observable<{ updated: boolean; admin: AdminProfile }> {
    return this.api
      .patch<{ updated: boolean; admin: AdminProfile }>('/admin/auth/me', data)
      .pipe(tap((response) => this.setAdmin(response.admin)));
  }

  private setAdmin(admin: Admin): void {
    this.adminSignal.set(admin);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.adminSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  }
}
