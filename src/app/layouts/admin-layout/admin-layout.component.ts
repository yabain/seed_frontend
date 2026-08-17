import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SiteConfigService } from '../../core/services/site-config.service';

interface AdminNavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
}

interface AdminNavGroup {
  caption: string;
  items: AdminNavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly siteConfigService = inject(SiteConfigService);

  readonly siteConfig = this.siteConfigService.config;

  ngOnInit(): void {
    this.siteConfigService.load();
  }

  readonly navGroups: AdminNavGroup[] = [
    {
      caption: 'Administration',
      items: [
        { label: 'Tableau de bord', path: '/admin/dashboard', icon: 'ti ti-dashboard', exact: true },
        { label: 'Actualités', path: '/admin/news', icon: 'ti ti-article' },
        { label: 'Ressources', path: '/admin/resources', icon: 'ti ti-files' },
        { label: 'Programmes', path: '/admin/programs', icon: 'ti ti-plant-2' },
      ],
    },
    {
      caption: 'Showcase',
      items: [
        { label: 'Bannière', path: '/admin/banner', icon: 'ti ti-photo' },
        { label: 'Partenaires', path: '/admin/partners', icon: 'ti ti-users-group' },
        { label: 'À propos', path: '/admin/about', icon: 'ti ti-info-circle' },
      ],
    },
    {
      caption: 'Communication',
      items: [
        { label: 'Messages', path: '/admin/messages', icon: 'ti ti-mail' },
        { label: 'Prospects', path: '/admin/prospects', icon: 'ti ti-clipboard-list' },
        { label: 'E-mails', path: '/admin/email', icon: 'ti ti-send' },
      ],
    },
    {
      caption: 'Système',
      items: [
        { label: 'Comptes', path: '/admin/users', icon: 'ti ti-user-cog' },
        { label: 'Journal', path: '/admin/audit-logs', icon: 'ti ti-clock-2' },
      ],
    },
  ];

  collapsed = false;
  mobileOpen = false;
  profileMenuOpen = false;
  readonly year = new Date().getFullYear();

  toggleCollapsed(): void {
    if (window.innerWidth < 1025) {
      this.mobileOpen = !this.mobileOpen;
      return;
    }
    this.collapsed = !this.collapsed;
  }

  toggleProfile($event: Event): void {
    $event.stopPropagation();
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  onBackdropClick($event: Event): void {
    $event.stopPropagation();
    this.mobileOpen = false;
  }

  onWindowClick(): void {
    this.mobileOpen = false;
    this.profileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick($event: Event): void {
    const target = $event.target as HTMLElement | null;
    if (target && target.closest('.header-user-profile')) {
      return;
    }
    this.profileMenuOpen = false;
    if (window.innerWidth < 1025 && target && target.closest('.pc-sidebar')) {
      return;
    }
    this.mobileOpen = false;
  }

  onMenuClick(): void {
    if (window.innerWidth < 1025) {
      this.mobileOpen = false;
    }
  }

  logout(): void {
    this.auth.logout();
    window.location.href = '/admin/login';
  }
}