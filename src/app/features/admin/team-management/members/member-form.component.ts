import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TeamService } from '../../../../core/services/team.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AdminImageFieldComponent } from '../../../../shared/components/admin-image-field/admin-image-field.component';
import type { TeamMember, TeamSection } from '../../../../core/models/models';
import type { ErrorMessage } from '../../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminImageFieldComponent],
  templateUrl: './member-form.component.html',
  styleUrls: ['../../management.scss', './member-form.component.scss'],
})
export class MemberFormComponent implements OnInit {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly sections = signal<TeamSection[]>([]);

  readonly form: TeamMember = {
    _id: '',
    name: '',
    role: '',
    description: '',
    photo: '',
    isActive: true,
    socialLinks: { facebook: '', twitter: '', x: '', linkedin: '', instagram: '' },
    sectionIds: [],
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly teamService: TeamService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadSections();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editing.set(true);
      this.loading.set(true);
      this.teamService.getMember(id).subscribe({
        next: (member) => {
          this.form._id = member._id ?? '';
          this.form.name = member.name ?? '';
          this.form.role = member.role ?? '';
          this.form.description = member.description ?? '';
          this.form.photo = member.photo ?? '';
          this.form.isActive = member.isActive ?? true;
          this.form.socialLinks = {
            facebook: member.socialLinks?.facebook ?? '',
            twitter: member.socialLinks?.twitter ?? '',
            x: member.socialLinks?.x ?? '',
            linkedin: member.socialLinks?.linkedin ?? '',
            instagram: member.socialLinks?.instagram ?? '',
          };
          this.form.sectionIds = [...(member.sectionIds ?? [])];
          this.loading.set(false);
        },
        error: (err: ErrorMessage) => {
          this.loading.set(false);
          this.toastService.error(
            err.details?.join(' ') ||
              err.message ||
              'Impossible de charger le membre.',
          );
        },
      });
    }
  }

  loadSections(): void {
    this.teamService.listSections().subscribe({
      next: (items) => this.sections.set(items.map((s) => ({ ...s }))),
      error: () => this.sections.set([]),
    });
  }

  setPhoto(url: string): void {
    this.form.photo = url;
  }

  toggleSection(id: string): void {
    const current = this.form.sectionIds ?? [];
    this.form.sectionIds = current.includes(id)
      ? current.filter((s) => s !== id)
      : [...current, id];
  }

  cancel(): void {
    void this.router.navigate(['/admin/team']);
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.toastService.warning('Le nom du membre est obligatoire.');
      return;
    }
    this.saving.set(true);

    const payload: Partial<TeamMember> = {
      name: this.form.name.trim(),
      role: (this.form.role ?? '').trim(),
      description: (this.form.description ?? '').trim(),
      photo: this.form.photo ?? '',
      isActive: this.form.isActive ?? true,
      socialLinks: {
        facebook: (this.form.socialLinks?.facebook ?? '').trim(),
        twitter: (this.form.socialLinks?.twitter ?? '').trim(),
        x: (this.form.socialLinks?.x ?? '').trim(),
        linkedin: (this.form.socialLinks?.linkedin ?? '').trim(),
        instagram: (this.form.socialLinks?.instagram ?? '').trim(),
      },
      sectionIds: this.form.sectionIds ?? [],
    };

    const editing = this.editing();
    const memberId = this.form._id;
    if (editing && !memberId) {
      this.saving.set(false);
      this.toastService.error('Identifiant du membre manquant.');
      return;
    }
    const request = editing
      ? this.teamService.updateMember(memberId as string, payload)
      : this.teamService.createMember(payload);

    request.subscribe({
      next: (created) => {
        this.saving.set(false);
        this.toastService.success(
          editing
            ? 'Membre mis à jour avec succès.'
            : 'Membre créé avec succès.',
        );
        void this.router.navigate(['/admin/team', created._id]);
      },
      error: (err: ErrorMessage) => {
        this.saving.set(false);
        this.toastService.error(
          err.details?.join(' ') ||
            err.message ||
            "Erreur lors de l'enregistrement.",
        );
      },
    });
  }
}