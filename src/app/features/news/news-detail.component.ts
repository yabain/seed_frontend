import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NewsService } from '../../core/services/news.service';
import type { News } from '../../core/models/models';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './news-detail.component.html',
  styleUrl: './news-detail.component.scss',
})
export class NewsDetailComponent implements OnInit {
  readonly news = signal<News | null>(null);
  readonly notFound = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly newsService: NewsService,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.newsService.getBySlug(slug).subscribe({
      next: (item) => this.news.set(item),
      error: () => this.notFound.set(true),
    });
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

  paragraphs(): string[] {
    return (this.news()?.content ?? '').split(/\n+/).filter((p) => p.trim());
  }
}