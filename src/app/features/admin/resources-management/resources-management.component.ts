import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ResourcesService } from '../../../core/services/resources.service';
import { ToastService } from '../../../core/services/toast.service';
import { SegmentVisibilityComponent } from '../../../shared/components/segment-visibility/segment-visibility.component';
import { formatBytes } from '../../../shared/utils/file.util';
import type { Resource } from '../../../core/models/models';

@Component({
  selector: 'app-resources-management',
  standalone: true,
  imports: [CommonModule, RouterLink, SegmentVisibilityComponent],
  templateUrl: './resources-management.component.html',
  styleUrl: '../management.scss',
})
export class ResourcesManagementComponent implements OnInit {
  readonly items = signal<Resource[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly searchQuery = signal('');

  private searchTimer: any;

  constructor(
    private readonly resourcesService: ResourcesService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.resourcesService
      .getAll({ page: this.page(), limit: this.limit(), search: this.searchQuery() })
      .subscribe({
        next: (data) => {
          this.items.set(data.items);
          this.total.set(data.total);
        },
        error: () => this.toastService.error('Impossible de charger les ressources.'),
        complete: () => this.loading.set(false),
      });
  }

  onSearch(value: string): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchQuery.set(value);
    this.page.set(1);
    this.searchTimer = setTimeout(() => this.load(), 300);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.limit()));
  }

  hasPrev(): boolean {
    return this.page() > 1;
  }

  hasNext(): boolean {
    return this.page() < this.totalPages();
  }

  previousPage(): void {
    if (this.hasPrev()) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  onLimitChange(value: string): void {
    this.limit.set(parseInt(value, 10));
    this.page.set(1);
    this.load();
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
}
