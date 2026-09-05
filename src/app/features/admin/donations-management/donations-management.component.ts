import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DonationsService } from '../../../core/services/donations.service';
import { SegmentVisibilityComponent } from '../../../shared/components/segment-visibility/segment-visibility.component';
import { LandingSectionEditorComponent } from '../../../shared/components/landing-section-editor/landing-section-editor.component';
import { ToastService } from '../../../core/services/toast.service';
import type { DonationMethod } from '../../../core/models/models';

@Component({
  selector: 'app-donations-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SegmentVisibilityComponent,
    LandingSectionEditorComponent,
  ],
  templateUrl: './donations-management.component.html',
  styleUrls: ['../management.scss', './donations-management.component.scss'],
})
export class DonationsManagementComponent implements OnInit {
  readonly items = signal<DonationMethod[]>([]);
  readonly loading = signal(true);
  readonly searchQuery = signal('');

  readonly filteredItems = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return this.items();
    }
    return this.items().filter((m) =>
      [m.name, m.details, m.paymentLink].some((v) => v?.toLowerCase().includes(q)),
    );
  });

  constructor(
    private readonly router: Router,
    private readonly donationsService: DonationsService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.donationsService.getAll().subscribe({
      next: (data) => this.items.set(data),
      error: () => this.toastService.error('Impossible de charger les méthodes de don.'),
      complete: () => this.loading.set(false),
    });
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  edit(method: DonationMethod): void {
    void this.router.navigate(['/admin/donations', method._id, 'edit']);
  }

  toggleActive(method: DonationMethod): void {
    this.donationsService.toggleActive(method._id!).subscribe({
      next: () => {
        this.load();
        this.toastService.success(
          method.isActive ? 'Méthode de don masquée.' : 'Méthode de don activée.',
        );
      },
      error: () => this.toastService.error('Erreur lors du changement de statut.'),
    });
  }

  remove(method: DonationMethod): void {
    if (!window.confirm(`Supprimer la méthode de don « ${method.name} » ?`)) {
      return;
    }
    this.donationsService.remove(method._id!).subscribe({
      next: () => {
        this.load();
        this.toastService.success('Méthode de don supprimée.');
      },
      error: () => this.toastService.error('Erreur lors de la suppression.'),
    });
  }
}