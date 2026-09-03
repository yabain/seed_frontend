import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminImageFieldComponent } from '../../../shared/components/admin-image-field/admin-image-field.component';
import { ROLE_LABELS, type UserRole } from '../../../core/constants/roles';
import type { AdminProfile } from '../../../core/models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminImageFieldComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly profile = signal<AdminProfile | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploadingAvatar = signal(false);

  form = { name: '', phone: '' };

  ngOnInit(): void {
    this.auth.refreshProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.form = { name: profile.name ?? '', phone: profile.phone ?? '' };
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger votre profil.');
        this.loading.set(false);
      },
    });
  }

  roleLabel(role?: string): string {
    return ROLE_LABELS[role as UserRole] ?? role ?? '—';
  }

  initials(name?: string): string {
    return (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?';
  }

  formatDate(iso?: string): string {
    if (!iso) {
      return '—';
    }
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  onAvatarChange(url: string): void {
    this.uploadingAvatar.set(true);
    this.auth.updateProfile({ avatar: url }).subscribe({
      next: () => {
        this.uploadingAvatar.set(false);
        this.toast.success(
          url ? 'Photo de profil mise à jour.' : 'Photo de profil supprimée.',
        );
      },
      error: () => {
        this.uploadingAvatar.set(false);
        this.toast.error('Échec de la mise à jour de la photo.');
      },
    });
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.toast.warning('Le nom est requis.');
      return;
    }

    this.saving.set(true);
    this.auth
      .updateProfile({
        name: this.form.name.trim(),
        phone: this.form.phone.trim(),
      })
      .subscribe({
        next: (response) => {
          this.profile.set(response.admin);
          this.saving.set(false);
          this.toast.success('Profil enregistré.');
        },
        error: () => {
          this.saving.set(false);
          this.toast.error("Échec de l'enregistrement du profil.");
        },
      });
  }
}
