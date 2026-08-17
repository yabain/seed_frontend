import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsService } from '../../core/services/news.service';
import type { Paginated, News } from '../../core/models/models';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './news-list.component.html',
  styleUrl: './news-list.component.scss',
})
export class NewsListComponent implements OnInit {
  readonly result = signal<Paginated<News>>({ items: [], total: 0, page: 1, limit: 9 });
  readonly loading = signal(true);
  search = '';

  constructor(private readonly newsService: NewsService) {}

  ngOnInit(): void {
    this.loadPage(1);
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

  onSearch(): void {
    this.loadPage(1);
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