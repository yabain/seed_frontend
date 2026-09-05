import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DonationsService } from '../../../../core/services/donations.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AdminImageFieldComponent } from '../../../../shared/components/admin-image-field/admin-image-field.component';
import type { ErrorMessage } from '../../../../core/interceptors/error.interceptor';
import type { DonationMethod } from '../../../../core/models/models';

@Component({
  selector: 'app-donation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminImageFieldComponent],
  templateUrl: './donation-form.component.html',
  styleUrls: ['../../management.scss', './donation-form.component.scss'],
})
export class DonationFormComponent implements OnInit {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);

  readonly form: DonationMethod = {
    _id: '',
    name: '',
    logo: '',
    qrCodeImage: '',
    paymentLink: '',
    details: '',
    order: 0,
    isActive: true,
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly donationsService: DonationsService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editing.set(true);
      this.loading.set(true);
      this.donationsService.getOne(id).subscribe({
        next: (item) => {
          Object.assign(this.form, item);
          this.loading.set(false);
        },
        error: (err: ErrorMessage) => {
          this.loading.set(false);
          this.toastService.error(
            err.details?.join(' ') || err.message || 'Impossible de charger la méthode de don.',
          );
        },
      });
    }
  }

  setLogo(url: string): void {
    this.form.logo = url;
  }

  setQrCode(url: string): void {
    this.form.qrCodeImage = url;
  }

  cancel(): void {
    void this.router.navigate(['/admin/donations']);
  }

  save(): void {
    this.saving.set(true);

    const payload: Partial<DonationMethod> = {
      name: this.form.name.trim(),
      logo: (this.form.logo ?? '').trim(),
      qrCodeImage: (this.form.qrCodeImage ?? '').trim(),
      paymentLink: this.form.paymentLink.trim(),
      details: (this.form.details ?? '').trim(),
      order: Number(this.form.order) || 0,
      isActive: this.form.isActive,
    };

    for (const key of ['name', 'logo', 'qrCodeImage', 'paymentLink', 'details'] as const) {
      if (!payload[key]) {
        delete payload[key];
      }
    }

    const editing = this.editing();
    const request = editing
      ? this.donationsService.update(this.form._id!, payload)
      : this.donationsService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.success(
          editing ? 'Méthode de don mise à jour.' : 'Méthode de don créée.',
        );
        void this.router.navigate(['/admin/donations']);
      },
      error: (err: ErrorMessage) => {
        this.saving.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.',
        );
      },
    });
  }
}