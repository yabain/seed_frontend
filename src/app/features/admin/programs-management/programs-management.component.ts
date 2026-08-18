import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramsService } from '../../../core/services/programs.service';
import { ToastService } from '../../../core/services/toast.service';
import { SegmentVisibilityComponent } from '../../../shared/components/segment-visibility/segment-visibility.component';
import { readFileAsDataUrl } from '../../../shared/utils/file.util';
import type { Program } from '../../../core/models/models';

const ICON_OPTIONS = [
  { value: 'education', label: 'Éducation' },
  { value: 'environment', label: 'Environnement' },
  { value: 'entrepreneurship', label: 'Entrepreneuriat' },
  { value: 'health', label: 'Santé' },
];

@Component({
  selector: 'app-programs-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SegmentVisibilityComponent],
  templateUrl: './programs-management.component.html',
  styleUrl: '../management.scss',
})
export class ProgramsManagementComponent implements OnInit {
  readonly iconOptions = ICON_OPTIONS;
  readonly items = signal<Program[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editing = signal<Program | null>(null);
  readonly saving = signal(false);

  readonly form: Program = {
    _id: '',
    title: '',
    excerpt: '',
    description: '',
    visual: '',
    icon: 'education',
    order: 0,
    isActive: true,
  };

  constructor(
    private readonly programsService: ProgramsService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.programsService.getAll().subscribe({
      next: (items) => this.items.set(items),
      error: () => this.toastService.error('Impossible de charger les programmes.'),
      complete: () => this.loading.set(false),
    });
  }

  startCreate(): void {
    this.editing.set(null);
    this.resetForm();
    this.showForm.set(true);
  }

  startEdit(item: Program): void {
    this.editing.set(item);
    Object.assign(this.form, item);
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  async onVisualChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }
    const result = await readFileAsDataUrl(file);
    this.form.visual = result.dataUrl;
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

    const editing = this.editing();
    const request = editing
      ? this.programsService.update(editing._id, payload)
      : this.programsService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancel();
        this.load();
        this.toastService.success(
          editing ? 'Programme mis à jour avec succès.' : 'Programme créé avec succès.',
        );
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.',
        );
      },
    });
  }

  remove(item: Program): void {
    if (!window.confirm(`Supprimer le programme « ${item.title} » ?`)) {
      return;
    }
    this.programsService.remove(item._id).subscribe({
      next: () => {
        this.load();
        this.toastService.success('Programme supprimé.');
      },
      error: () => this.toastService.error('Erreur lors de la suppression.'),
    });
  }

  private resetForm(): void {
    this.form.title = '';
    this.form.excerpt = '';
    this.form.description = '';
    this.form.visual = '';
    this.form.icon = 'education';
    this.form.order = 0;
    this.form.isActive = true;
  }
}