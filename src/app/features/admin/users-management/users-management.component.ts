import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsersService } from '../../../core/services/users.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import type { AdminUser, UserRole, UsersListResult, UserStats } from '../../../core/models/models';

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Utilisateur',
  consultant: 'Consultant',
  admin: 'Administrateur',
  superadmin: 'Super admin',
};

export type StatusFilter = '' | 'active' | 'inactive' | 'admin' | 'consultant' | 'user';

interface StatItem {
  key: StatusFilter;
  label: string;
  value: number;
  icon: string;
  active: boolean;
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.scss',
})
export class UsersManagementComponent implements OnInit {
  readonly loading = signal(false);
  readonly items = signal<AdminUser[]>([]);
  readonly searchQuery = signal('');
  readonly activeFilter = signal<StatusFilter>('');
  readonly stats = signal<UserStats | null>(null);
  readonly meta = signal<UsersListResult['meta'] | null>(null);

  readonly page = signal(1);
  readonly limit = signal(10);

  readonly roleOptions: UserRole[] = ['user', 'consultant', 'admin', 'superadmin'];
  readonly roleLabels = ROLE_LABELS;

  readonly statItems = signal<StatItem[]>([]);

  private searchTimer: any;

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    this.usersService
      .getUsersList(this.page(), this.limit(), this.searchQuery(), this.activeFilter() || undefined)
      .subscribe({
      next: (result) => {
        this.items.set(result.data);
        this.meta.set(result.meta);
        this.stats.set(result.stats);
        this.updateStatItems(result.stats);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Impossible de charger les comptes.');
        this.loading.set(false);
      },
    });
  }

  private updateStatItems(stats: UserStats): void {
    const activeFilter = this.activeFilter();
    this.statItems.set([
      {
        key: '',
        label: 'Total',
        value: stats.total,
        icon: 'fa-solid fa-users',
        active: activeFilter === '',
      },
      {
        key: 'active',
        label: 'Actifs',
        value: stats.active,
        icon: 'fa-solid fa-circle-check',
        active: activeFilter === 'active',
      },
      {
        key: 'inactive',
        label: 'Désactivés',
        value: stats.inactive,
        icon: 'fa-solid fa-ban',
        active: activeFilter === 'inactive',
      },
      {
        key: 'admin',
        label: 'Admins',
        value: stats.admins,
        icon: 'fa-solid fa-shield-halved',
        active: activeFilter === 'admin',
      },
      {
        key: 'consultant',
        label: 'Consultants',
        value: stats.consultants,
        icon: 'fa-solid fa-briefcase',
        active: activeFilter === 'consultant',
      },
      {
        key: 'user',
        label: 'Utilisateurs',
        value: stats.users,
        icon: 'fa-solid fa-user',
        active: activeFilter === 'user',
      },
    ]);
  }

  onSearch(value: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchQuery.set(value);
    this.page.set(1);
    this.searchTimer = setTimeout(() => this.load(), 300);
  }

  setFilter(filter: StatusFilter): void {
    if (this.activeFilter() === filter) {
      this.activeFilter.set('');
    } else {
      this.activeFilter.set(filter);
    }
    this.page.set(1);
    this.load();
  }

  previousPage(): void {
    if (this.meta() && this.page() > 1) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.meta() && this.meta()!.hasNextPage) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  onLimitChange(value: string): void {
    this.limit.set(parseInt(value, 10));
    this.page.set(1);
    this.load();
  }

  goToDetail(user: AdminUser): void {
    void this.router.navigate(['/admin/users', user.id]);
  }

  isSelf(user: AdminUser): boolean {
    return user.id === this.authService.admin()?.id;
  }

  formatDate(iso?: string): string {
    if (!iso) return 'Jamais';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
