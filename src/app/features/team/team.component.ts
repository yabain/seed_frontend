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

  /**
   * Sections affichées publiquement : sections actives contenant
   * au moins un membre (une section vide n'est jamais affichée).
   */
  populatedSections(): TeamSection[] {
    return this.visibleSections().filter(
      (s) => this.membersOf(s._id).length > 0,
    );
  }

  /** Nombre total de membres visibles (libres + membres des sections affichées). */
  totalVisibleMemberCount(): number {
    return (
      this.populatedSections().reduce(
        (sum, s) => sum + this.membersOf(s._id).length,
        0,
      ) + this.membersOf().length
    );
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

  /**
 * Palette de teintes dérivées de la couleur primaire (récupérée en base),
 * pour rester dans la même famille de couleur que l'identité du site.
 */
private palette(): string[] {
  const raw = (this.siteConfig()?.primaryColor ?? '').trim();
  const base = /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : '#0ea5e9';
  return [0, 6, 12, 18, 24, 30, 10, 20].map((amount) => this.tint(base, amount));
}

/** Éclaircit un hex vers le blanc. */
private tint(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const delta = Math.round(2.55 * amount);
  const channel = (value: number) =>
    Math.min(255, Math.max(0, value + delta))
      .toString(16)
      .padStart(2, '0');
  return (
    '#' +
    channel((num >> 16) & 0xff) +
    channel((num >> 8) & 0xff) +
    channel(num & 0xff)
  );
}

/** Propriété CSS custom d'accent (couleur unique) pour la section d'index donné. */
sectionStyle(index: number): Record<string, string> {
  const palette = this.palette();
  return {
    '--sec-c1': palette[index % palette.length],
  };
}

readonly expandedCard = signal<number | null>(null);

toggleCard(index: number): void {
  this.expandedCard.update((current) => (current === index ? null : index));
}
}