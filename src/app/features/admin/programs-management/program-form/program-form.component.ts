import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgramsService } from '../../../../core/services/programs.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AdminImageFieldComponent } from '../../../../shared/components/admin-image-field/admin-image-field.component';
import type { Program } from '../../../../core/models/models';

const ICON_OPTIONS = [
  { value: 'education', label: 'Éducation' },
  { value: 'environment', label: 'Environnement' },
  { value: 'entrepreneurship', label: 'Entrepreneuriat' },
  { value: 'health', label: 'Santé' },
];

@Component({
  selector: 'app-program-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminImageFieldComponent],
  templateUrl: './program-form.component.html',
  styleUrl: '../../resources-management/resource-form/resource-form.component.scss',
})
export class ProgramFormComponent implements OnInit {
  readonly iconOptions = ICON_OPTIONS;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = {
    title: '',
    excerpt: '',
    description: '',
    visual: '',
    icon: 'education',
    order: 0,
    isActive: true,
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly programsService: ProgramsService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      this.load(id);
    }
  }

  get isEdit(): boolean {
    return this.editingId() !== null;
  }

  private load(id: string): void {
    this.loading.set(true);
    this.programsService.getOne(id).subscribe({
      next: (item) => {
        this.form.title = item.title;
        this.form.excerpt = item.excerpt ?? '';
        this.form.description = item.description ?? '';
        this.form.icon = item.icon || 'education';
        this.form.order = item.order ?? 0;
        this.form.isActive = item.isActive ?? true;
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Programme introuvable.');
        void this.router.navigate(['/admin/programs']);
      },
    });
  }

  setVisibility(visibility: 'public' | 'private'): void {
    this.form.isActive = visibility === 'public';
  }

  get visibility(): 'public' | 'private' {
    return this.form.isActive ? 'public' : 'private';
  }

  onVisualChange(visual: string): void {
    this.form.visual = visual;
  }

  save(): void {
    if (!this.form.title.trim()) {
      this.toastService.warning('Le titre est obligatoire.');
      return;
    }
    this.saving.set(true);

    const payload: Partial<Program> = {
      title: this.form.title.trim(),
      excerpt: (this.form.excerpt ?? '').trim(),
      description: this.form.description,
      visual: this.form.visual,
      icon: this.form.icon,
      order: Number(this.form.order) || 0,
      isActive: this.form.isActive,
    };

    const request = this.isEdit
      ? this.programsService.update(this.editingId()!, payload)
      : this.programsService.create(payload);

    request.subscribe({
      next: () => {
        this.toastService.success(
          this.isEdit ? 'Programme mis à jour.' : 'Programme créé.',
        );
        void this.router.navigate(['/admin/programs']);
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.',
        );
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/admin/programs']);
  }
}
