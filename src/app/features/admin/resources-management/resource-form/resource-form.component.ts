import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourcesService } from '../../../../core/services/resources.service';
import { ToastService } from '../../../../core/services/toast.service';
import { readFileAsDataUrl } from '../../../../shared/utils/file.util';
import type { Resource } from '../../../../core/models/models';

@Component({
  selector: 'app-resource-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-form.component.html',
  styleUrl: './resource-form.component.scss',
})
export class ResourceFormComponent implements OnInit {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly currentFileUrl = signal('');

  readonly form = {
    title: '',
    category: '',
    description: '',
    isPublished: true,
  };

  file: {
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  } | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly resourcesService: ResourcesService,
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
    this.resourcesService.getOne(id).subscribe({
      next: (item) => {
        this.form.title = item.title;
        this.form.category = item.category ?? '';
        this.form.description = item.description ?? '';
        this.form.isPublished = item.isPublished ?? true;
        this.currentFileUrl.set(item.fileUrl ?? '');
        this.file = {
          fileUrl: item.fileUrl ?? '',
          fileName: item.fileName ?? '',
          fileType: item.fileType ?? '',
          fileSize: item.fileSize ?? 0,
        };
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Ressource introuvable.');
        void this.router.navigate(['/admin/resources']);
      },
    });
  }

  setVisibility(visibility: 'public' | 'private'): void {
    this.form.isPublished = visibility === 'public';
  }

  get visibility(): 'public' | 'private' {
    return this.form.isPublished ? 'public' : 'private';
  }

  async onFileChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const result = await readFileAsDataUrl(file);
    this.file = {
      fileUrl: result.dataUrl,
      fileName: result.fileName,
      fileType: result.fileType,
      fileSize: result.fileSize,
    };
    this.currentFileUrl.set(result.dataUrl);
  }

  save(): void {
    if (!this.form.title.trim()) {
      this.toastService.warning('Le titre est obligatoire.');
      return;
    }
    if (!this.isEdit && !this.file) {
      this.toastService.warning('Veuillez sélectionner un fichier.');
      return;
    }
    this.saving.set(true);

    const payload: Partial<Resource> = {
      title: this.form.title.trim(),
      category: this.form.category.trim(),
      description: this.form.description.trim(),
      isPublished: this.form.isPublished,
    };
    if (this.file) {
      payload.fileUrl = this.file.fileUrl;
      payload.fileName = this.file.fileName;
      payload.fileType = this.file.fileType;
      payload.fileSize = this.file.fileSize;
    }

    const request = this.isEdit
      ? this.resourcesService.update(this.editingId()!, payload)
      : this.resourcesService.create(payload);

    request.subscribe({
      next: () => {
        this.toastService.success(
          this.isEdit ? 'Ressource mise à jour.' : 'Ressource créée.',
        );
        void this.router.navigate(['/admin/resources']);
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
    void this.router.navigate(['/admin/resources']);
  }

  formatSize(size?: number): string {
    if (!size) return '—';
    if (size < 1024) return `${size} o`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }
}
