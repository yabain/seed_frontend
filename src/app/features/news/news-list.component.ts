import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NewsService } from '../../core/services/news.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { PageBackgroundService } from '../../core/services/page-background.service';
import type { Paginated, News } from '../../core/models/models';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news-list.component.html',
  styleUrl: './news-list.component.scss',
})
export class NewsListComponent implements OnInit, OnDestroy {
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly pageBackgroundService = inject(PageBackgroundService);
  readonly siteConfig = this.siteConfigService.config;
  readonly pageBackground = this.pageBackgroundService.background;
  readonly result = signal<Paginated<News>>({ items: [], total: 0, page: 1, limit: 9 });
  readonly loading = signal(true);
  search = '';
  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly newsService: NewsService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.pageBackgroundService.load();
    this.loadPage(1);
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  goToDetail(item: News): void {
    void this.router.navigate(['/news', item.slug || item._id]);
  }

  onSearchInput(value: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.search = value;
    this.searchTimer = setTimeout(() => this.loadPage(1), 300);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.newsService.getPublished({ page, limit: 9, search: this.search }).subscribe({
      next: (data) => {
        this.result.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  pages(): number[] {
    const { total, limit } = this.result();
    return Array.from({ length: Math.max(1, Math.ceil(total / limit)) }, (_, i) => i + 1);
  }

  formatDate(iso?: string): string {
    if (!iso) {
      return '';
    }
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
