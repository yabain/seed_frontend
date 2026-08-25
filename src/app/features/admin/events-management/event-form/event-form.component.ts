import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventsService } from '../../../../core/services/events.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AdminImageFieldComponent } from '../../../../shared/components/admin-image-field/admin-image-field.component';
import type { ErrorMessage } from '../../../../core/interceptors/error.interceptor';
import type { SeedEvent, EventPanelist, EventSocialLinks } from '../../../../core/models/models';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminImageFieldComponent],
  templateUrl: './event-form.component.html',
  styleUrls: ['../../management.scss', './event-form.component.scss'],
})
export class EventFormComponent implements OnInit {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);

  readonly form = {
    title: '',
    description: '',
    image: '',
    startDate: '',
    endDate: '',
    location: '',
    program: '',
    socialLinks: {
      facebook: '',
      x: '',
      youtube: '',
      linkedin: '',
    },
    phone1: '',
    phone2: '',
    email: '',
    panelists: [] as EventPanelist[],
    registrationLink: '',
    isVisibleOnLanding: false,
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventsService: EventsService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editing.set(true);
      this.loading.set(true);
      this.eventsService.getOne(id).subscribe({
        next: (item: SeedEvent) => {
          this.form.title = item.title;
          this.form.description = item.description ?? '';
          this.form.image = item.image ?? '';
          this.form.startDate = item.startDate ? this.toDateTimeLocal(item.startDate) : '';
          this.form.endDate = item.endDate ? this.toDateTimeLocal(item.endDate) : '';
          this.form.location = item.location ?? '';
          this.form.program = item.program ?? '';
          this.form.socialLinks = {
            facebook: item.socialLinks?.facebook ?? '',
            x: item.socialLinks?.x ?? '',
            youtube: item.socialLinks?.youtube ?? '',
            linkedin: item.socialLinks?.linkedin ?? '',
          };
          this.form.phone1 = item.phone1 ?? '';
          this.form.phone2 = item.phone2 ?? '';
          this.form.email = item.email ?? '';
          this.form.panelists = (item.panelists ?? []).map((p) => ({ ...p }));
          this.form.registrationLink = item.registrationLink ?? '';
          this.form.isVisibleOnLanding = item.isVisibleOnLanding ?? false;
          this.loading.set(false);
        },
        error: (err: ErrorMessage) => {
          this.loading.set(false);
          this.toastService.error(
            err.details?.join(' ') || err.message || 'Impossible de charger l\'événement.',
          );
        },
      });
    }
  }

  private toDateTimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  setImage(url: string): void {
    this.form.image = url;
  }

  addPanelist(): void {
    this.form.panelists.push({ photo: '', name: '', title: '' });
  }

  removePanelist(index: number): void {
    this.form.panelists.splice(index, 1);
  }

  setPanelistPhoto(index: number, url: string): void {
    this.form.panelists[index].photo = url;
  }

  trackByIndex(index: number): number {
    return index;
  }

  cancel(): void {
    void this.router.navigate(['/admin/events']);
  }

  save(): void {
    if (!this.form.title.trim()) {
      this.toastService.warning('Le titre est obligatoire.');
      return;
    }
    if (!this.form.startDate) {
      this.toastService.warning('La date de début est obligatoire.');
      return;
    }
    if (!this.form.endDate) {
      this.toastService.warning('La date de fin est obligatoire.');
      return;
    }

    this.saving.set(true);

    const panelists = this.form.panelists
      .filter((p) => p.name.trim())
      .map((p) => ({
        photo: p.photo,
        name: p.name.trim(),
        title: p.title?.trim() || '',
      }));

    const socialLinks: Partial<EventSocialLinks> = {};
    if (this.form.socialLinks['facebook'].trim()) socialLinks['facebook'] = this.form.socialLinks['facebook'].trim();
    if (this.form.socialLinks['x'].trim()) socialLinks['x'] = this.form.socialLinks['x'].trim();
    if (this.form.socialLinks['youtube'].trim()) socialLinks['youtube'] = this.form.socialLinks['youtube'].trim();
    if (this.form.socialLinks['linkedin'].trim()) socialLinks['linkedin'] = this.form.socialLinks['linkedin'].trim();

    const payload: Partial<SeedEvent> = {
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      image: this.form.image,
      startDate: new Date(this.form.startDate).toISOString(),
      endDate: new Date(this.form.endDate).toISOString(),
      location: this.form.location.trim(),
      program: this.form.program.trim(),
      socialLinks: socialLinks as EventSocialLinks,
      phone1: this.form.phone1.trim(),
      phone2: this.form.phone2.trim(),
      email: this.form.email.trim(),
      panelists,
      registrationLink: this.form.registrationLink.trim(),
      isVisibleOnLanding: this.form.isVisibleOnLanding,
    };

    const editing = this.editing();
    const request = editing
      ? this.eventsService.update(this.route.snapshot.paramMap.get('id')!, payload)
      : this.eventsService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.success(
          editing ? 'Événement mis à jour avec succès.' : 'Événement créé avec succès.',
        );
        void this.router.navigate(['/admin/events']);
      },
      error: (err: ErrorMessage) => {
        this.saving.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de l\'enregistrement.',
        );
      },
    });
  }
}
