import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PartnersService } from '../../../core/services/partners.service';
import { ToastService } from '../../../core/services/toast.service';
import { SegmentVisibilityComponent } from '../../../shared/components/segment-visibility/segment-visibility.component';
import type { Partner } from '../../../core/models/models';

@Component({
  selector: 'app-partners-management',
  standalone: true,
  imports: [CommonModule, RouterLink, SegmentVisibilityComponent],
  templateUrl: './partners-management.component.html',
  styleUrls: ['../management.scss', './partners-management.component.scss'],
})
export class PartnersManagementComponent implements OnInit {
  readonly items = signal<Partner[]>([]);
  readonly loading = signal(true);

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
    this.partnersService.getAll().subscribe({
      next: (items) => this.items.set(items),
      error: () => this.toastService.error('Impossible de charger les partenaires.'),
      complete: () => this.loading.set(false),
    });
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