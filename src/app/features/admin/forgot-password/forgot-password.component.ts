import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SiteConfigService } from '../../../core/services/site-config.service';
import { ToastService } from '../../../core/services/toast.service';
import { BannerService } from '../../../core/services/banner.service';
import type { ErrorMessage } from '../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements OnInit {
  readonly submitting = signal(false);
  readonly sent = signal(false);
  readonly authBackgroundImage = signal('');

  readonly siteConfig = this.siteConfigService.config;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly siteConfigService: SiteConfigService,
    private readonly toastService: ToastService,
    private readonly bannerService: BannerService,
  ) {}

  ngOnInit(): void {
    this.siteConfigService.load();
    this.bannerService.getPublic().subscribe({ next: (banner) => this.authBackgroundImage.set(banner.authBackgroundImage ?? '') });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { email } = this.form.value as { email: string };

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.sent.set(true);
        this.toastService.success(
          response.message || 'E-mail de réinitialisation envoyé.',
        );
      },
      error: (err: ErrorMessage) => {
        this.submitting.set(false);
        this.toastService.error(
          err.details?.join(' ') ||
            err.message ||
            "Impossible d'envoyer l'e-mail de réinitialisation.",
        );
      },
    });
  }
}
