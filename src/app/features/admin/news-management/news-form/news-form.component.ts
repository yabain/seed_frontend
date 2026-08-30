import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NewsService } from '../../../../core/services/news.service';
import { NewsCategoryService } from '../../../../core/services/news-category.service';
import { SiteConfigService } from '../../../../core/services/site-config.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AdminImageFieldComponent } from '../../../../shared/components/admin-image-field/admin-image-field.component';
import type { ErrorMessage } from '../../../../core/interceptors/error.interceptor';
import type { News, NewsCategory } from '../../../../core/models/models';

@Component({
  selector: 'app-news-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminImageFieldComponent],
  templateUrl: './news-form.component.html',
  styleUrls: ['../../management.scss', './news-form.component.scss'],
})
export class NewsFormComponent implements OnInit {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly categories = signal<NewsCategory[]>([]);

  readonly form = {
    title: '',
    excerpt: '',
    content: '',
    status: 'draft' as 'draft' | 'published',
    image: '',
    tags: '',
    author: this.siteConfig()?.orgName?.trim() || 'Organisation',
    categories: [] as string[],
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly newsService: NewsService,
    private readonly newsCategoryService: NewsCategoryService,
    private readonly toastService: ToastService,
    private readonly siteConfigService: SiteConfigService,
  ) {}

  siteConfig() {
    return this.siteConfigService.config();
  }

  ngOnInit(): void {
    this.newsCategoryService.getAll().subscribe({
      next: (items) => this.categories.set(items),
      error: () => this.categories.set([]),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editing.set(true);
      this.loading.set(true);
      this.newsService.getOne(id).subscribe({
        next: (item: News) => {
          this.form.title = item.title;
          this.form.excerpt = item.excerpt ?? '';
          this.form.content = item.content;
          this.form.status = item.status;
          this.form.image = item.image ?? '';
          this.form.tags = (item.tags ?? []).join(', ');
          this.form.author = item.author || this.siteConfig()?.orgName?.trim() || 'Organisation';
          this.form.categories = item.categories ?? [];
          this.loading.set(false);
        },
        error: (err: ErrorMessage) => {
          this.loading.set(false);
          this.toastService.error(
            err.details?.join(' ') || err.message || 'Impossible de charger l’actualité.',
          );
        },
      });
    }
  }

  toggleCategory(name: string): void {
    const list = this.form.categories;
    this.form.categories = list.includes(name)
      ? list.filter((c) => c !== name)
      : [...list, name];
  }

  setImage(url: string): void {
    this.form.image = url;
  }

  cancel(): void {
    void this.router.navigate(['/admin/news']);
  }

  save(): void {
    if (!this.form.title.trim() || !this.form.content.trim()) {
      this.toastService.warning('Le titre et le contenu sont obligatoires.');
      return;
    }
    this.saving.set(true);

    const payload: Partial<News> = {
      title: this.form.title.trim(),
      excerpt: this.form.excerpt.trim(),
      content: this.form.content,
      status: this.form.status,
      image: this.form.image,
      author: this.form.author || this.siteConfig()?.orgName?.trim() || 'Organisation',
      tags: this.form.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t),
      categories: this.form.categories,
    };

    const editing = this.editing();
    const request = editing
      ? this.newsService.update(this.route.snapshot.paramMap.get('id')!, payload)
      : this.newsService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.success(
          editing ? 'Actualité mise à jour avec succès.' : 'Actualité créée avec succès.',
        );
        void this.router.navigate(['/admin/news']);
      },
      error: (err: ErrorMessage) => {
        this.saving.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.',
        );
      },
    });
  }
}
