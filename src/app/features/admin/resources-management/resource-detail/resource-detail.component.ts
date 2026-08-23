import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ResourcesService } from '../../../../core/services/resources.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import type { Resource } from '../../../../core/models/models';

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './resource-detail.component.html',
  styleUrls: ['../../content-detail.scss'],
})
export class ResourceDetailComponent implements OnInit {
  readonly loading = signal(true);
  readonly resource = signal<Resource | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly resourcesService: ResourcesService,
    private readonly toastService: ToastService,
    protected readonly authService: AuthService,
  ) {}

  get isAdmin(): boolean {
    return ['admin', 'superadmin'].includes(this.authService.admin()?.role ?? '');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/admin/resources']);
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.resourcesService.getOne(id).subscribe({
      next: (resource) => {
        this.resource.set(resource);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Ressource introuvable.');
        void this.router.navigate(['/admin/resources']);
      },
    });
  }

  formatSize(bytes?: number): string {
    if (!bytes) return '—';
    const units = ['o', 'Ko', 'Mo', 'Go'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
  }

  fileIcon(): string {
    const type = this.resource()?.fileType ?? '';
    if (type.includes('pdf')) return 'ti ti-file-type-pdf';
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv'))
      return 'ti ti-file-type-spreadsheet';
    if (type.includes('word') || type.includes('document'))
      return 'ti ti-file-type-doc';
    if (type.includes('image')) return 'ti ti-photo';
    return 'ti ti-file';
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  back(): void {
    void this.router.navigate(['/admin/resources']);
  }
}
