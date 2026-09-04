import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TeamService } from '../../../../core/services/team.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { TeamSection } from '../../../../core/models/models';

@Component({
  selector: 'app-sections-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sections-management.component.html',
  styleUrls: ['../../management.scss', './sections-management.component.scss'],
})
export class SectionsManagementComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly sections = signal<TeamSection[]>([]);

  /** Index de la section en cours d'édition, ou -1 si le formulaire est en mode création. */
  readonly editingIndex = signal(-1);
  readonly showForm = signal(false);

  readonly form = { title: '', subtitle: '' };

  constructor(
    private readonly teamService: TeamService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.teamService.listSections().subscribe({
      next: (items) => {
        this.sections.set(items.map((s) => ({ ...s })));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Impossible de charger les sections.');
      },
    });
  }

  startCreate(): void {
    this.form.title = '';
    this.form.subtitle = '';
    this.editingIndex.set(-1);
    this.showForm.set(true);
  }

  startEdit(index: number): void {
    const section = this.sections()[index];
    if (!section) return;
    this.form.title = section.title;
    this.form.subtitle = section.subtitle ?? '';
    this.editingIndex.set(index);
    this.showForm.set(true);
  }

  cancelEdit(): void {
    this.editingIndex.set(-1);
    this.showForm.set(false);
  }

  submit(): void {
    const title = this.form.title.trim();
    if (!title) {
      this.toastService.warning('Le titre de la section est obligatoire.');
      return;
    }
    this.saving.set(true);

    const payload = { title, subtitle: this.form.subtitle.trim() };
    const index = this.editingIndex();

    if (index >= 0) {
      const section = this.sections()[index];
      if (!section?._id) {
        this.saving.set(false);
        this.cancelEdit();
        return;
      }
      this.teamService.updateSection(section._id, payload).subscribe({
        next: (updated) => {
          this.sections.update((list) =>
            list.map((s, i) =>
              i === index ? { ...s, ...updated } : s,
            ),
          );
          this.saving.set(false);
          this.cancelEdit();
          this.toastService.success('Section mise à jour.');
        },
        error: () => {
          this.saving.set(false);
          this.toastService.error('Erreur lors de la mise à jour.');
        },
      });
      return;
    }

    this.teamService.createSection(payload).subscribe({
      next: (created) => {
        this.sections.update((list) => [...list, created]);
        this.saving.set(false);
        this.cancelEdit();
        this.toastService.success('Section créée.');
      },
      error: () => {
        this.saving.set(false);
        this.toastService.error('Erreur lors de la création.');
      },
    });
  }

  toggle(section: TeamSection): void {
    if (!section._id) return;
    this.teamService
      .updateSection(section._id, { isActive: !(section.isActive ?? true) })
      .subscribe({
        next: (updated) => {
          this.sections.update((list) =>
            list.map((s) => (s._id === updated._id ? { ...s, ...updated } : s)),
          );
        },
        error: () => {
          this.toastService.error('Impossible de modifier l’état de la section.');
        },
      });
  }

  remove(index: number): void {
    const section = this.sections()[index];
    if (!section?._id) return;
    if (!window.confirm(`Supprimer la section « ${section.title} » ?`)) {
      return;
    }
    this.teamService.removeSection(section._id).subscribe({
      next: () => {
        this.sections.update((list) => list.filter((_, i) => i !== index));
        if (this.editingIndex() === index) {
          this.cancelEdit();
        }
        this.toastService.success('Section supprimée.');
      },
      error: () => {
        this.toastService.error('Erreur lors de la suppression.');
      },
    });
  }
}