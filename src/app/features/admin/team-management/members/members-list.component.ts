import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { TeamService, TeamMemberListResult } from '../../../../core/services/team.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { TeamMember, TeamSection } from '../../../../core/models/models';
import type { ErrorMessage } from '../../../../core/interceptors/error.interceptor';

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './members-list.component.html',
  styleUrls: ['../../management.scss', './members-list.component.scss'],
})
export class MembersListComponent implements OnInit {
  readonly items = signal<TeamMember[]>([]);
  readonly sections = signal<TeamSection[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly sectionFilter = signal('');
  readonly searchQuery = signal('');
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly pagination = signal<TeamMemberListResult['pagination'] | null>(null);
  readonly togglingId = signal('');

  private searchTimer: any;

  constructor(
    private readonly teamService: TeamService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSections();
    this.load();
  }

  loadSections(): void {
    this.teamService.listSections().subscribe({
      next: (items) =>
        this.sections.set(items.map((s) => ({ ...s }))),
      error: () => this.sections.set([]),
    });
  }

  load(): void {
    this.loading.set(true);
    this.teamService
      .listMembers({
        search: this.searchQuery().trim() || undefined,
        sectionId: this.sectionFilter() || undefined,
        page: this.page(),
        limit: this.limit(),
      })
      .subscribe({
        next: (result) => {
          this.items.set(result.data);
          this.total.set(result.pagination.totalItems);
          this.pagination.set(result.pagination ?? null);
        },
        error: () =>
          this.toastService.error('Impossible de charger les membres.'),
        complete: () => this.loading.set(false),
      });
  }

  onSearch(value: string): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchQuery.set(value);
    this.page.set(1);
    this.searchTimer = setTimeout(() => this.load(), 300);
  }

  onSectionChange(value: string): void {
    this.sectionFilter.set(value);
    this.page.set(1);
    this.load();
  }

  onLimitChange(value: string): void {
    this.limit.set(parseInt(value, 10));
    this.page.set(1);
    this.load();
  }

  hasPrev(): boolean {
    return this.pagination()?.hasPrevPage ?? false;
  }

  hasNext(): boolean {
    return this.pagination()?.hasNextPage ?? false;
  }

  previousPage(): void {
    if (this.hasPrev()) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  open(member: TeamMember): void {
    void this.router.navigate(['/admin/team', member._id]);
  }

  edit(member: TeamMember): void {
    void this.router.navigate(['/admin/team', member._id, 'edit']);
  }

  /** Bascule la visibilité publique du membre dans la liste. */
  toggleActive(member: TeamMember): void {
    if (!member._id) return;
    this.togglingId.set(member._id);
    this.teamService
      .updateMember(member._id, { isActive: !(member.isActive ?? true) })
      .subscribe({
        next: (updated) => {
          this.items.update((list) =>
            list.map((m) =>
              m._id === updated._id ? { ...m, isActive: updated.isActive } : m,
            ),
          );
          this.togglingId.set('');
        },
        error: (err: ErrorMessage) => {
          this.togglingId.set('');
          this.toastService.error(
            err.details?.join(' ') ||
              err.message ||
              'Impossible de modifier la visibilité du membre.',
          );
        },
      });
  }

  remove(member: TeamMember): void {
    if (!member._id) return;
    if (!window.confirm(`Supprimer définitivement « ${member.name} » ?`)) {
      return;
    }
    this.teamService.removeMember(member._id).subscribe({
      next: () => {
        this.toastService.success('Membre supprimé.');
        this.load();
      },
      error: (err: ErrorMessage) =>
        this.toastService.error(
          err.details?.join(' ') ||
            err.message ||
            'Erreur lors de la suppression.',
        ),
    });
  }

  sectionNames(member: TeamMember): string {
    const ids = member.sectionIds ?? [];
    if (!ids.length) {
      return 'Sans groupe';
    }
    return this.sections()
      .filter((s) => ids.includes(s._id ?? ''))
      .map((s) => s.title)
      .join(', ');
  }

  sectionLabel(member: TeamMember): string {
    const ids = member.sectionIds ?? [];
    if (!ids.length) {
      return 'Sans groupe';
    }
    return (
      this.sections()
        .filter((s) => ids.includes(s._id ?? ''))
        .map((s) => s.title)
        .join(', ') || 'Section inconnue'
    );
  }
}