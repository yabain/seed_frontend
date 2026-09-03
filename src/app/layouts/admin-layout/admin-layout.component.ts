import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { CONTENT_ROLES, ROLE_LABELS, isAdminRole, type UserRole } from '../../core/constants/roles';

interface AdminNavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
  roles?: readonly UserRole[];
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
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly siteConfigService = inject(SiteConfigService);

  readonly siteConfig = this.siteConfigService.config;

  firstName(): string {
    const name = this.auth.admin()?.name?.trim() || '';
    return name.split(/\s+/)[0] || 'Admin';
  }

  roleLabel(): string {
    const role = this.auth.admin()?.role ?? '';
    return ROLE_LABELS[role as UserRole] ?? role;
  }

  ngOnInit(): void {
    this.siteConfigService.load();
  }

  readonly navGroups: AdminNavGroup[] = [
    {
      caption: 'Administration',
      items: [
        { label: 'Tableau de bord', path: '/admin/dashboard', icon: 'ti ti-dashboard', exact: true },
        { label: 'Tracking', path: '/admin/tracking', icon: 'ti ti-radar' },
        {
          label: 'Actualités',
          path: '/admin/news',
          icon: 'ti ti-article',
          roles: CONTENT_ROLES,
        },
        {
          label: 'Ressources',
          path: '/admin/resources',
          icon: 'ti ti-files',
          roles: CONTENT_ROLES,
        },
        {
          label: 'Programmes',
          path: '/admin/programs',
          icon: 'ti ti-plant-2',
          roles: CONTENT_ROLES,
        },
        {
          label: 'Événements',
          path: '/admin/events',
          icon: 'ti ti-calendar-event',
          roles: CONTENT_ROLES,
        },
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
        { label: 'Annonces', path: '/admin/announcements', icon: 'ti ti-speakerphone' },
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

  readonly visibleGroups = computed<AdminNavGroup[]>(() => {
    const role = this.auth.admin()?.role ?? '';
    const isAdmin = isAdminRole(role);
    return this.navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          isAdmin ? true : (item.roles?.includes(role as UserRole) ?? false),
        ),
      }))
      .filter((group) => group.items.length > 0);
  });

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
    if (window.innerWidth < 1025 && target && (target.closest('.pc-sidebar') || target.closest('.mobile-menu'))) {
      return;
    }
    this.mobileOpen = false;
  }

  onMenuClick(): void {
    if (window.innerWidth < 1025) {
      this.mobileOpen = false;
    }
  }

  onContentClick(): void {
    this.mobileOpen = false;
  }

  logout(): void {
    void this.auth.logout().subscribe(() => {
      void this.router.navigate(['/admin/login']);
    });
  }
}
