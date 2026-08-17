import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProspectsService } from '../../../core/services/prospects.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ProspectItem, ProspectPagination } from '../../../core/services/prospects.service';

@Component({
  selector: 'app-prospects-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './prospects-management.component.html',
  styleUrl: './prospects-management.component.scss',
})
export class ProspectsManagementComponent implements OnInit {
  readonly loading = signal(true);
  readonly items = signal<ProspectItem[]>([]);
  readonly keyword = signal('');

  readonly page = signal(1);
  readonly limit = 25;

  readonly meta = signal<ProspectPagination | null>(null);

  constructor(
    private readonly prospectsService: ProspectsService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    this.prospectsService.list(this.page(), this.limit, this.keyword() || undefined).subscribe({
      next: (result) => {
        this.items.set(result.data);
        this.meta.set(result.pagination);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Impossible de charger les prospects.');
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.keyword.set(value);
    this.page.set(1);
    this.load();
  }

  previousPage(): void {
    if (this.meta() && this.page() > 1) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.meta() && this.meta()!.hasNextPage) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
