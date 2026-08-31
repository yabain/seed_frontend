import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { SiteConfigService } from '../../../core/services/site-config.service';
import type { LandingSections, SiteSegments } from '../../../core/models/models';

interface NavLink {
  label: string;
  path: string;
  segment?: keyof SiteSegments;
  landingSection?: keyof LandingSections;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly router = inject(Router);

  readonly mobileOpen = signal(false);
  readonly siteConfig = this.siteConfigService.config;

  readonly isHome = signal(false);
  readonly scrolled = signal(false);

  readonly baseLinks: NavLink[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Actualités', path: '/news', segment: 'news', landingSection: 'news' },
    { label: 'Nos Actions', path: '/programs', segment: 'programs', landingSection: 'programs' },
    // { label: 'Partenaires', path: '/partners', segment: 'partners', landingSection: 'partners' },
    { label: 'Ressources', path: '/resources', segment: 'resources' },
    { label: 'Événements', path: '/events', segment: 'events', landingSection: 'events' },
    { label: 'Contact', path: '/contact' },
  ];

  readonly links = computed(() => {
    const config = this.siteConfig();
    return this.baseLinks
      .filter((link) => !link.segment || (config?.segments?.[link.segment] ?? true))
      .map((link) => ({
        ...link,
        label:
          (link.landingSection
            ? config?.landingSections?.[link.landingSection]?.eyebrow?.trim()
            : '') ||
          link.label,
      }));
  });

  constructor(private readonly siteConfigService: SiteConfigService) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isHome.set((event as NavigationEnd).url === '/');
        this.updateScrollState();
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.updateScrollState();
  }

  private updateScrollState(): void {
    this.scrolled.set(typeof window !== 'undefined' ? window.scrollY > 40 : false);
  }

  toggleMenu(): void {
    this.mobileOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.mobileOpen.set(false);
  }
}
