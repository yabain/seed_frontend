import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SiteConfigService } from '../../../core/services/site-config.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ErrorMessage } from '../../../core/interceptors/error.interceptor';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!password || !confirmPassword) {
    return null;
  }
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  readonly submitting = signal(false);
  readonly token = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  readonly siteConfig = this.siteConfigService.config;

  readonly form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly siteConfigService: SiteConfigService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.siteConfigService.load();
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.token.set(token);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { password } = this.form.value as { password: string };

    this.authService.resetPassword(this.token()!, password).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.toastService.success(
          response.message || 'Mot de passe réinitialisé avec succès.',
        );
        void this.router.navigate(['/admin/login']);
      },
      error: (err: ErrorMessage) => {
        this.submitting.set(false);
        this.toastService.error(
          err.details?.join(' ') ||
            err.message ||
            'Impossible de réinitialiser le mot de passe.',
        );
      },
    });
  }
}
