import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PartnersService } from '../../../core/services/partners.service';
import { ToastService } from '../../../core/services/toast.service';
import { SegmentVisibilityComponent } from '../../../shared/components/segment-visibility/segment-visibility.component';
import { LandingSectionEditorComponent } from '../../../shared/components/landing-section-editor/landing-section-editor.component';
import type { Partner } from '../../../core/models/models';

@Component({
  selector: 'app-partners-management',
  standalone: true,
  imports: [CommonModule, RouterLink, SegmentVisibilityComponent, LandingSectionEditorComponent],
  templateUrl: './partners-management.component.html',
  styleUrls: ['../management.scss', './partners-management.component.scss'],
})
export class PartnersManagementComponent implements OnInit {
  readonly items = signal<Partner[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly total = signal(0);
  readonly searchQuery = signal('');

  private searchTimer: any;

  constructor(
    private readonly router: Router,
    private readonly partnersService: PartnersService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.partnersService
      .getAll({ page: this.page(), limit: this.limit(), search: this.searchQuery() })
      .subscribe({
        next: (data) => {
          this.items.set(data.items);
          this.total.set(data.total);
        },
        error: () => this.toastService.error('Impossible de charger les partenaires.'),
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

  edit(item: Partner): void {
    void this.router.navigate(['/admin/partners', item._id, 'edit']);
  }

  remove(item: Partner): void {
    if (!window.confirm(`Supprimer le partenaire « ${item.name} » ?`)) {
      return;
    }
    this.partnersService.remove(item._id).subscribe({
      next: () => {
        this.load();
        this.toastService.success('Partenaire supprimé.');
      },
      error: () => this.toastService.error('Erreur lors de la suppression.'),
    });
  }
}
