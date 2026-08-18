import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResourcesService } from '../../../core/services/resources.service';
import { ToastService } from '../../../core/services/toast.service';
import { SegmentVisibilityComponent } from '../../../shared/components/segment-visibility/segment-visibility.component';
import { readFileAsDataUrl, formatBytes } from '../../../shared/utils/file.util';
import type { Resource } from '../../../core/models/models';

@Component({
  selector: 'app-resources-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SegmentVisibilityComponent],
  templateUrl: './resources-management.component.html',
  styleUrl: '../management.scss',
})
export class ResourcesManagementComponent implements OnInit {
  readonly items = signal<Resource[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editing = signal<Resource | null>(null);
  readonly saving = signal(false);

  readonly form = {
    title: '',
    category: '',
    description: '',
    fileUrl: '',
    fileName: '',
    fileType: '',
    fileSize: 0,
    isPublished: true,
  };

  constructor(
    private readonly resourcesService: ResourcesService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.resourcesService.getAll().subscribe({
      next: (data) => this.items.set(data.items),
      error: () => this.toastService.error('Impossible de charger les ressources.'),
      complete: () => this.loading.set(false),
    });
  }

  startCreate(): void {
    this.editing.set(null);
    this.resetForm();
    this.showForm.set(true);
  }

  startEdit(item: Resource): void {
    this.editing.set(item);
    this.form.title = item.title;
    this.form.category = item.category ?? '';
    this.form.description = item.description ?? '';
    this.form.fileUrl = item.fileUrl ?? '';
    this.form.fileName = item.fileName ?? '';
    this.form.fileType = item.fileType ?? '';
    this.form.fileSize = item.fileSize ?? 0;
    this.form.isPublished = item.isPublished ?? true;
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  async onFileChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }
    const result = await readFileAsDataUrl(file);
    this.form.fileUrl = result.dataUrl;
    this.form.fileName = result.fileName;
    this.form.fileType = result.fileType;
    this.form.fileSize = result.fileSize;
  }

  save(): void {
    if (!this.form.title.trim()) {
      this.toastService.warning('Le titre est obligatoire.');
      return;
    }
    this.saving.set(true);

    const payload: Partial<Resource> = {
      title: this.form.title.trim(),
      category: this.form.category.trim(),
      description: this.form.description.trim(),
      fileUrl: this.form.fileUrl,
      fileName: this.form.fileName,
      fileType: this.form.fileType,
      fileSize: this.form.fileSize,
      isPublished: this.form.isPublished,
    };

    const editing = this.editing();
    const request = editing
      ? this.resourcesService.update(editing._id, payload)
      : this.resourcesService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancel();
        this.load();
        this.toastService.success(
          editing ? 'Ressource mise à jour avec succès.' : 'Ressource créée avec succès.',
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

  remove(item: Resource): void {
    if (!window.confirm(`Supprimer la ressource « ${item.title} » ?`)) {
      return;
    }
    this.resourcesService.remove(item._id).subscribe({
      next: () => {
        this.load();
        this.toastService.success('Ressource supprimée.');
      },
      error: () => this.toastService.error('Erreur lors de la suppression.'),
    });
  }

  formatSize(size?: number): string {
    return formatBytes(size);
  }

  private resetForm(): void {
    this.form.title = '';
    this.form.category = '';
    this.form.description = '';
    this.form.fileUrl = '';
    this.form.fileName = '';
    this.form.fileType = '';
    this.form.fileSize = 0;
    this.form.isPublished = true;
  }
}