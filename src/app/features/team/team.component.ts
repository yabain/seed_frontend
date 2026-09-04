import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TeamService } from '../../core/services/team.service';
import { PartnersService } from '../../core/services/partners.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { PageBackgroundService } from '../../core/services/page-background.service';
import type { Partner, Team, TeamMember, TeamSection } from '../../core/models/models';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
})
export class TeamComponent implements OnInit {
  private readonly partnersService = inject(PartnersService);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly pageBackgroundService = inject(PageBackgroundService);
  readonly siteConfig = this.siteConfigService.config;
  readonly pageBackground = this.pageBackgroundService.background;
  readonly team = signal<Team>({ sections: [], members: [] });
  readonly partners = signal<Partner[]>([]);
  readonly loading = signal(true);

  constructor(private readonly teamService: TeamService) {}

  ngOnInit(): void {
    this.pageBackgroundService.load();
    this.teamService.getPublic().subscribe({
      next: (data) =>
        this.team.set({
          sections: data.sections ?? [],
          members: data.members ?? [],
        }),
      error: () => this.team.set({ sections: [], members: [] }),
      complete: () => this.loading.set(false),
    });
    this.partnersService.getPublic().subscribe({
      next: (items) => this.partners.set(items.filter((p) => p.isActive ?? true)),
      error: () => this.partners.set([]),
    });
  }

  membersOf(sectionId?: string): TeamMember[] {
    const members = this.team().members;
    if (!sectionId) {
      const activeIds = new Set(this.visibleSections().map((s) => s._id));
      return members.filter((m) => {
        const ids = m.sectionIds ?? [];
        if (!ids.length) {
          return true;
        }
        return !ids.some((id) => activeIds.has(id));
      });
    }
    return members.filter((m) =>
      (m.sectionIds ?? []).some((id) => id === sectionId),
    );
  }

  /** Sections actives (les sections désactivées sont masquées). */
  visibleSections(): TeamSection[] {
    return (this.team().sections ?? []).filter((s) => s.isActive !== false);
  }

  /** Vrai s'il existe au moins une section active à afficher. */
  hasVisibleSections(): boolean {
    return this.visibleSections().length > 0;
  }

  /** Nombre de membres affichés publiquement (actifs + libres). */
  visibleMemberCount(): number {
    const sections = this.visibleSections();
    if (sections.length === 0) {
      return (this.team().members ?? []).length;
    }
    const activeIds = new Set(sections.map((s) => s._id));
    return (this.team().members ?? []).filter((m) => {
      const ids = m.sectionIds ?? [];
      if (!ids.length) {
        return true;
      }
      return !ids.some((id) => activeIds.has(id));
    }).length;
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
}