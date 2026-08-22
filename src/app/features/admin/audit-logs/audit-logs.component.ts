import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AuditLogEntry, AuditLogsResult } from '../../../core/models/models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss',
})
export class AuditLogsComponent implements OnInit {
  readonly loading = signal(true);
  readonly logs = signal<AuditLogEntry[]>([]);
  readonly meta = signal<AuditLogsResult['meta'] | null>(null);

  readonly page = signal(1);
  readonly limit = 20;

  readonly q = signal('');
  readonly actionFilter = signal('');
  readonly resourceTypeFilter = signal('');
  readonly methodFilter = signal('');
  readonly statusCodeFilter = signal('');
  readonly fromDate = signal('');
  readonly toDate = signal('');

  readonly authPresets = [
    { label: 'Connexions', prefix: 'auth.' },
    { label: 'Sécurité', prefix: 'auth.two_factor' },
  ];

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    this.auditLogService.list(this.page(), this.limit, {
      q: this.q() || undefined,
      action: this.actionFilter() || undefined,
      resourceType: this.resourceTypeFilter() || undefined,
      method: this.methodFilter() || undefined,
      statusCode: this.statusCodeFilter() || undefined,
      from: this.fromDate() || undefined,
      to: this.toDate() || undefined,
    }).subscribe({
      next: (result) => {
        this.logs.set(result.data);
        this.meta.set(result.meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Impossible de charger les logs.',
        );
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.q.set(value);
    this.page.set(1);
    this.load();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  applyPreset(prefix: string): void {
    this.actionFilter.set(prefix);
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

  getActionCategory(action: string): { label: string; color: string; bg: string } {
    if (action.startsWith('auth.two_factor')) {
      return { label: '2FA', color: 'var(--color-primary-dark)', bg: 'color-mix(in srgb, var(--color-primary) 22%, #ffffff)' };
    }
    if (action.startsWith('auth.')) {
      return { label: 'Auth', color: '#1d4ed8', bg: '#dbeafe' };
    }
    if (action.startsWith('user.')) {
      return { label: 'Utilisateur', color: '#9333ea', bg: '#f3e8ff' };
    }
    return { label: 'Autre', color: '#475569', bg: '#f1f5f9' };
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  truncate(text: string, max = 60): string {
    if (!text) return '—';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }
}
