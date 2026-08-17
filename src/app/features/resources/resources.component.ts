import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourcesService } from '../../core/services/resources.service';
import type { Paginated, Resource } from '../../core/models/models';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.scss',
})
export class ResourcesComponent implements OnInit {
  readonly categories = signal<string[]>([]);
  readonly result = signal<Paginated<Resource>>({ items: [], total: 0, page: 1, limit: 12 });
  readonly loading = signal(true);
  selectedCategory = '';

  constructor(private readonly resourcesService: ResourcesService) {}

  ngOnInit(): void {
    this.resourcesService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.resourcesService
      .getPublished({ page, limit: 12, category: this.selectedCategory })
      .subscribe({
        next: (data) => {
          this.result.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  selectCategory(category: string): void {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.loadPage(1);
  }

  pages(): number[] {
    const { total, limit } = this.result();
    return Array.from({ length: Math.max(1, Math.ceil(total / limit)) }, (_, i) => i + 1);
  }

  formatSize(size?: number): string {
    if (!size) {
      return 'PDF';
    }
    return size > 1048576 ? `${(size / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(size / 1024))} Ko`;
  }
}