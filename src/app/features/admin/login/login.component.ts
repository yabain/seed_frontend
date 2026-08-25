import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SiteConfigService } from '../../../core/services/site-config.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ErrorMessage } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  readonly submitting = signal(false);
  readonly resending = signal(false);
  readonly requiresTwoFactor = signal(false);
  readonly emailFor2FA = signal('');
  readonly showPassword = signal(false);

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  readonly siteConfig = this.siteConfigService.config;

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly codeForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly siteConfigService: SiteConfigService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.siteConfigService.load();
  }

  submitCredentials(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { email, password } = this.loginForm.value as { email: string; password: string };

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.submitting.set(false);
        if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
          this.requiresTwoFactor.set(true);
          this.emailFor2FA.set(response.email);
        } else {
          const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/admin';
          void this.router.navigateByUrl(redirect);
        }
      },
      error: (err: ErrorMessage) => {
        this.submitting.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Échec de la connexion.',
        );
      },
    });
  }

  submitCode(): void {
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { code } = this.codeForm.value as { code: string };

    this.authService.verifyTwoFactor(this.emailFor2FA(), code).subscribe({
      next: () => {
        this.submitting.set(false);
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/admin';
        void this.router.navigateByUrl(redirect);
      },
      error: (err: ErrorMessage) => {
        this.submitting.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Code de vérification invalide.',
        );
      },
    });
  }

  resendCode(): void {
    this.resending.set(true);

    this.authService.sendTwoFactorCode(this.emailFor2FA()).subscribe({
      next: () => {
        this.resending.set(false);
        this.toastService.success('Code de vérification renvoyé.');
      },
      error: (err: ErrorMessage) => {
        this.resending.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Impossible de renvoyer le code.',
        );
      },
    });
  }

  backToCredentials(): void {
    this.requiresTwoFactor.set(false);
    this.emailFor2FA.set('');
    this.codeForm.reset();
  }
}
