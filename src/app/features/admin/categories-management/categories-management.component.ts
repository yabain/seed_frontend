import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NewsCategoryService } from '../../../core/services/news-category.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ErrorMessage } from '../../../core/interceptors/error.interceptor';
import type { NewsCategory } from '../../../core/models/models';

@Component({
  selector: 'app-categories-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './categories-management.component.html',
  styleUrls: ['../management.scss', './categories-management.component.scss'],
})
export class CategoriesManagementComponent implements OnInit {
  readonly items = signal<NewsCategory[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  newName = '';
  editName = '';

  constructor(
    private readonly newsCategoryService: NewsCategoryService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.newsCategoryService.getAll().subscribe({
      next: (items) => this.items.set(items),
      error: () => this.toastService.error('Impossible de charger les catégories.'),
      complete: () => this.loading.set(false),
    });
  }

  create(): void {
    const name = this.newName.trim();
    if (!name) {
      this.toastService.warning('Le nom de la catégorie est obligatoire.');
      return;
    }
    this.saving.set(true);
    this.newsCategoryService.create({ name }).subscribe({
      next: () => {
        this.saving.set(false);
        this.newName = '';
        this.load();
        this.toastService.success('Catégorie créée avec succès.');
      },
      error: (err: ErrorMessage) => {
        this.saving.set(false);
        this.toastService.error(err.details?.join(' ') || err.message || 'Impossible de créer la catégorie.');
      },
    });
  }

  startEdit(category: NewsCategory): void {
    this.editingId.set(category._id);
    this.editName = category.name;
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(category: NewsCategory): void {
    const name = this.editName.trim();
    if (!name) {
      this.toastService.warning('Le nom de la catégorie est obligatoire.');
      return;
    }
    this.saving.set(true);
    this.newsCategoryService.update(category._id, { name }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editingId.set(null);
        this.load();
        this.toastService.success('Catégorie mise à jour.');
      },
      error: (err: ErrorMessage) => {
        this.saving.set(false);
        this.toastService.error(err.details?.join(' ') || err.message || 'Impossible de modifier la catégorie.');
      },
    });
  }

  remove(category: NewsCategory): void {
    if (!window.confirm(`Supprimer la catégorie « ${category.name} » ?`)) {
      return;
    }
    this.newsCategoryService.remove(category._id).subscribe({
      next: () => {
        this.load();
        this.toastService.success('Catégorie supprimée.');
      },
      error: () => this.toastService.error('Impossible de supprimer la catégorie.'),
    });
  }
}