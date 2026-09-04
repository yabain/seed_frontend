import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TeamService } from '../../../../core/services/team.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { TeamMember, TeamSection } from '../../../../core/models/models';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './member-detail.component.html',
  styleUrls: ['../../management.scss', './member-detail.component.scss'],
})
export class MemberDetailComponent implements OnInit {
  readonly loading = signal(true);
  readonly member = signal<TeamMember | null>(null);
  readonly sections = signal<TeamSection[]>([]);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly teamService: TeamService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/admin/team']);
      return;
    }
    this.loadSections();
    this.load(id);
  }

  loadSections(): void {
    this.teamService.listSections().subscribe({
      next: (items) => this.sections.set(items.map((s) => ({ ...s }))),
      error: () => this.sections.set([]),
    });
  }

  load(id: string): void {
    this.loading.set(true);
    this.teamService.getMember(id).subscribe({
      next: (member) => {
        this.member.set(member);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Membre introuvable.');
        this.loading.set(false);
      },
    });
  }

  toggleActive(): void {
    const current = this.member();
    if (!current?._id) return;
    this.teamService
      .updateMember(current._id, { isActive: !(current.isActive ?? true) })
      .subscribe({
        next: (updated) => {
          this.member.set({ ...current, isActive: updated.isActive });
          this.toastService.success(
            updated.isActive === false
              ? 'Membre masqué du site public.'
              : 'Membre visible sur le site public.',
          );
        },
        error: () =>
          this.toastService.error('Impossible de modifier la visibilité.'),
      });
  }

  remove(): void {
    const current = this.member();
    if (!current?._id) return;
    if (!window.confirm(`Supprimer définitivement « ${current.name} » ?`)) {
      return;
    }
    this.teamService.removeMember(current._id).subscribe({
      next: () => {
        this.toastService.success('Membre supprimé.');
        void this.router.navigate(['/admin/team']);
      },
      error: () => this.toastService.error('Erreur lors de la suppression.'),
    });
  }

  sectionNames(member: TeamMember): string[] {
    const ids = member.sectionIds ?? [];
    if (!ids.length) {
      return [];
    }
    return this.sections()
      .filter((s) => ids.includes(s._id ?? ''))
      .map((s) => s.title);
  }

  hasSocials(member: TeamMember): boolean {
    const links = member.socialLinks;
    return !!(
      links &&
      (links.facebook ||
        links.x ||
        links.twitter ||
        links.linkedin ||
        links.instagram)
    );
  }

  back(): void {
    void this.router.navigate(['/admin/team']);
  }
}