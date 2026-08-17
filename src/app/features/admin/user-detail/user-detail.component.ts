import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsersService } from '../../../core/services/users.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import type { AdminUser, UserLogEntry, UsersListMeta } from '../../../core/models/models';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
})
export class UserDetailComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly user = signal<AdminUser | null>(null);
  readonly logs = signal<UserLogEntry[]>([]);
  readonly logsMeta = signal<UsersListMeta | null>(null);
  readonly logsLoading = signal(false);
  readonly logsPage = signal(1);
  readonly logsLimit = 20;

  readonly roleLabels = {
    user: 'Utilisateur',
    consultant: 'Consultant',
    admin: 'Administrateur',
    superadmin: 'Super admin',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
      this.loadLogs(id);
    }
  }

  loadUser(id: string): void {
    this.loading.set(true);

    this.usersService.getUser(id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Compte introuvable.');
        this.loading.set(false);
      },
    });
  }

  loadLogs(id: string, page = this.logsPage()): void {
    this.logsLoading.set(true);

    this.usersService.getUserLogs(id, page, this.logsLimit).subscribe({
      next: (result) => {
        this.logs.set(result.data);
        this.logsMeta.set(result.meta);
        this.logsLoading.set(false);
      },
      error: () => {
        this.logs.set([]);
        this.logsLoading.set(false);
      },
    });
  }

  toggleActive(): void {
    const current = this.user();
    if (!current) return;

    const targetActive = !current.isActive;
    this.saving.set(true);
    this.usersService.toggleUserActive(current.id).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.saving.set(false);
        this.toastService.success(
          targetActive ? 'Compte activé.' : 'Compte désactivé.',
        );
      },
      error: () => {
        this.toastService.error('Impossible de mettre à jour le statut.');
        this.saving.set(false);
      },
    });
  }

  back(): void {
    void this.router.navigate(['/admin/users']);
  }

  previousLogsPage(): void {
    if (this.logsMeta() && this.logsPage() > 1) {
      this.logsPage.update((p) => p - 1);
      const id = this.route.snapshot.paramMap.get('id');
      if (id) this.loadLogs(id, this.logsPage());
    }
  }

  nextLogsPage(): void {
    if (this.logsMeta() && this.logsMeta()!.hasNextPage) {
      this.logsPage.update((p) => p + 1);
      const id = this.route.snapshot.paramMap.get('id');
      if (id) this.loadLogs(id, this.logsPage());
    }
  }

  formatDate(iso?: string): string {
    if (!iso) return 'Jamais';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatLogDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isSelf(): boolean {
    const current = this.user();
    return !!current && current.id === this.authService.admin()?.id;
  }

  actionLabel(action: string): string {
    const map: Record<string, string> = {
      'user.created': 'Création',
      'user.updated': 'Modification',
      'user.deleted': 'Suppression',
      'user.activated': 'Activation',
      'user.deactivated': 'Désactivation',
      'user.password_changed': 'Mot de passe changé',
    };
    return map[action] || action;
  }
}
