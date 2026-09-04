import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProspectsService } from '../../../../core/services/prospects.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-prospect-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prospect-form.component.html',
  styleUrl: '../prospects-management.component.scss',
})
export class ProspectFormComponent implements OnInit {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = {
    name: '',
    email: '',
    phone: '',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly prospectsService: ProspectsService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      this.load(id);
    }
  }

  get isEdit(): boolean {
    return this.editingId() !== null;
  }

  private load(id: string): void {
    this.loading.set(true);
    this.prospectsService.list().subscribe({
      next: (result) => {
        const prospect = result.data.find((p) => p._id === id);
        if (!prospect) {
          this.toastService.error('Prospect introuvable.');
          void this.router.navigate(['/admin/prospects']);
          return;
        }
        this.form.name = prospect.name;
        this.form.email = prospect.email;
        this.form.phone = prospect.phone;
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Impossible de charger le prospect.');
        void this.router.navigate(['/admin/prospects']);
      },
    });
  }

  save(): void {
    if (!this.form.email.trim() && !this.form.phone.trim()) {
      this.toastService.warning(
        'Renseignez au moins un e-mail ou un numéro de téléphone.',
      );
      return;
    }
    this.saving.set(true);

    const payload = {
      name: this.form.name.trim() || undefined,
      email: this.form.email.trim(),
      phone: this.form.phone.trim() || undefined,
    };

    const request = this.isEdit
      ? this.prospectsService.update(this.editingId()!, payload)
      : this.prospectsService.create(payload);

    request.subscribe({
      next: () => void this.afterSave(),
      error: (err) => this.fail(err),
    });
  }

  private afterSave(): void {
    this.toastService.success(
      this.isEdit ? 'Prospect mis à jour.' : 'Prospect ajouté.',
    );
    void this.router.navigate(['/admin/prospects']);
  }

  private fail(err: { details?: string[]; message?: string }): void {
    this.saving.set(false);
    this.toastService.error(
      err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.',
    );
  }

  cancel(): void {
    void this.router.navigate(['/admin/prospects']);
  }
}
