import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PartnersService } from '../../../../core/services/partners.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AdminImageFieldComponent } from '../../../../shared/components/admin-image-field/admin-image-field.component';
import type { ErrorMessage } from '../../../../core/interceptors/error.interceptor';
import type { Partner } from '../../../../core/models/models';

@Component({
  selector: 'app-partner-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminImageFieldComponent],
  templateUrl: './partner-form.component.html',
  styleUrls: ['../../management.scss', './partner-form.component.scss'],
})
export class PartnerFormComponent implements OnInit {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);

  readonly form: Partner = {
    _id: '',
    name: '',
    logo: '',
    website: '',
    email: '',
    phone1: '',
    phone2: '',
    description: '',
    order: 0,
    isActive: true,
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly partnersService: PartnersService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editing.set(true);
      this.loading.set(true);
      this.partnersService.getOne(id).subscribe({
        next: (item) => {
          Object.assign(this.form, item);
          this.loading.set(false);
        },
        error: (err: ErrorMessage) => {
          this.loading.set(false);
          this.toastService.error(
            err.details?.join(' ') || err.message || 'Impossible de charger le partenaire.',
          );
        },
      });
    }
  }

  setLogo(url: string): void {
    this.form.logo = url;
  }

  cancel(): void {
    void this.router.navigate(['/admin/partners']);
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.toastService.warning('Le nom du partenaire est obligatoire.');
      return;
    }
    this.saving.set(true);

    const payload: Partial<Partner> = {
      name: this.form.name.trim(),
      logo: this.form.logo,
      website: (this.form.website ?? '').trim(),
      email: (this.form.email ?? '').trim(),
      phone1: (this.form.phone1 ?? '').trim(),
      phone2: (this.form.phone2 ?? '').trim(),
      description: (this.form.description ?? '').trim(),
      order: Number(this.form.order) || 0,
      isActive: this.form.isActive,
    };

    const editing = this.editing();
    const request = editing
      ? this.partnersService.update(this.form._id, payload)
      : this.partnersService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.success(
          editing ? 'Partenaire mis à jour avec succès.' : 'Partenaire créé avec succès.',
        );
        void this.router.navigate(['/admin/partners']);
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