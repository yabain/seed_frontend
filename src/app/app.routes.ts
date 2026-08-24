import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const CONTENT_ROLES = ['user', 'consultant', 'admin', 'superadmin'];

export const appRoutes: Routes = [
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin/forgot-password',
    loadComponent: () =>
      import('./features/admin/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'admin/reset-password',
    loadComponent: () =>
      import('./features/admin/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    canActivateChild: [RoleGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'tracking',
        loadComponent: () =>
          import('./features/admin/tracking/tracking.component').then(
            (m) => m.TrackingComponent,
          ),
      },
      {
        path: 'news',
        data: { roles: CONTENT_ROLES },
        loadComponent: () =>
          import('./features/admin/news-management/news-management.component').then(
            (m) => m.NewsManagementComponent,
          ),
      },
      {
        path: 'news/categories',
        data: { roles: ['admin', 'superadmin'] },
        loadComponent: () =>
          import('./features/admin/categories-management/categories-management.component').then(
            (m) => m.CategoriesManagementComponent,
          ),
      },
      {
        path: 'news/new',
        loadComponent: () =>
          import('./features/admin/news-management/news-form/news-form.component').then(
            (m) => m.NewsFormComponent,
          ),
      },
      {
        path: 'news/:id',
        data: { roles: CONTENT_ROLES },
        loadComponent: () =>
          import('./features/admin/news-management/news-detail/news-detail.component').then(
            (m) => m.NewsDetailComponent,
          ),
      },
      {
        path: 'news/:id/edit',
        data: { roles: ['admin', 'superadmin'] },
        loadComponent: () =>
          import('./features/admin/news-management/news-form/news-form.component').then(
            (m) => m.NewsFormComponent,
          ),
      },
      {
        path: 'resources',
        data: { roles: CONTENT_ROLES },
        loadComponent: () =>
          import('./features/admin/resources-management/resources-management.component').then(
            (m) => m.ResourcesManagementComponent,
          ),
      },
      {
        path: 'resources/new',
        loadComponent: () =>
          import(
            './features/admin/resources-management/resource-form/resource-form.component'
          ).then((m) => m.ResourceFormComponent),
      },
      {
        path: 'resources/:id',
        data: { roles: CONTENT_ROLES },
        loadComponent: () =>
          import(
            './features/admin/resources-management/resource-detail/resource-detail.component'
          ).then((m) => m.ResourceDetailComponent),
      },
      {
        path: 'resources/:id/edit',
        data: { roles: ['admin', 'superadmin'] },
        loadComponent: () =>
          import(
            './features/admin/resources-management/resource-form/resource-form.component'
          ).then((m) => m.ResourceFormComponent),
      },
      {
        path: 'programs',
        data: { roles: CONTENT_ROLES },
        loadComponent: () =>
          import('./features/admin/programs-management/programs-management.component').then(
            (m) => m.ProgramsManagementComponent,
          ),
      },
      {
        path: 'programs/new',
        loadComponent: () =>
          import(
            './features/admin/programs-management/program-form/program-form.component'
          ).then((m) => m.ProgramFormComponent),
      },
      {
        path: 'programs/:id',
        data: { roles: CONTENT_ROLES },
        loadComponent: () =>
          import(
            './features/admin/programs-management/program-detail/program-detail.component'
          ).then((m) => m.ProgramDetailComponent),
      },
      {
        path: 'programs/:id/edit',
        data: { roles: ['admin', 'superadmin'] },
        loadComponent: () =>
          import(
            './features/admin/programs-management/program-form/program-form.component'
          ).then((m) => m.ProgramFormComponent),
      },
      {
        path: 'partners',
        loadComponent: () =>
          import('./features/admin/partners-management/partners-management.component').then(
            (m) => m.PartnersManagementComponent,
          ),
      },
      {
        path: 'partners/new',
        loadComponent: () =>
          import('./features/admin/partners-management/partner-form/partner-form.component').then(
            (m) => m.PartnerFormComponent,
          ),
      },
      {
        path: 'partners/:id/edit',
        loadComponent: () =>
          import('./features/admin/partners-management/partner-form/partner-form.component').then(
            (m) => m.PartnerFormComponent,
          ),
      },
      {
        path: 'banner',
        loadComponent: () =>
          import('./features/admin/banner-management/banner-management.component').then(
            (m) => m.BannerManagementComponent,
          ),
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/admin/about-management/about-management.component').then(
            (m) => m.AboutManagementComponent,
          ),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/admin/messages-management/messages-management.component').then(
            (m) => m.MessagesManagementComponent,
          ),
      },
      {
        path: 'messages/:id',
        loadComponent: () =>
          import(
            './features/admin/messages-management/message-detail/message-detail.component'
          ).then((m) => m.MessageDetailComponent),
      },
      {
        path: 'profile',
        data: { roles: ['*'] },
        loadComponent: () =>
          import('./features/admin/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users-management/users-management.component').then(
            (m) => m.UsersManagementComponent,
          ),
      },
      {
        path: 'users/new',
        loadComponent: () =>
          import(
            './features/admin/users-management/user-form/user-form.component'
          ).then((m) => m.UserFormComponent),
      },
      {
        path: 'users/:id/edit',
        loadComponent: () =>
          import(
            './features/admin/users-management/user-form/user-form.component'
          ).then((m) => m.UserFormComponent),
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./features/admin/user-detail/user-detail.component').then(
            (m) => m.UserDetailComponent,
          ),
      },
      {
        path: 'email',
        loadComponent: () =>
          import('./features/admin/email-settings/email-settings.component').then(
            (m) => m.EmailSettingsComponent,
          ),
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/admin/audit-logs/audit-logs.component').then(
            (m) => m.AuditLogsComponent,
          ),
      },
      {
        path: 'prospects',
        loadComponent: () =>
          import('./features/admin/prospects-management/prospects-management.component').then(
            (m) => m.ProspectsManagementComponent,
          ),
      },
      {
        path: 'announcements',
        loadComponent: () =>
          import(
            './features/admin/announcements-management/announcements-list.component'
          ).then((m) => m.AnnouncementsListComponent),
      },
      {
        path: 'announcements/settings',
        loadComponent: () =>
          import(
            './features/admin/announcements-management/announcement-settings.component'
          ).then((m) => m.AnnouncementSettingsComponent),
      },
      {
        path: 'announcements/new',
        loadComponent: () =>
          import(
            './features/admin/announcements-management/announcement-form.component'
          ).then((m) => m.AnnouncementFormComponent),
      },
      {
        path: 'announcements/:id/edit',
        loadComponent: () =>
          import(
            './features/admin/announcements-management/announcement-form.component'
          ).then((m) => m.AnnouncementFormComponent),
      },
      {
        path: 'announcements/:id/detail',
        loadComponent: () =>
          import(
            './features/admin/announcements-management/announcement-detail.component'
          ).then((m) => m.AnnouncementDetailComponent),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then(
        (m) => m.PublicLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'news',
        loadComponent: () =>
          import('./features/news/news-list.component').then((m) => m.NewsListComponent),
      },
      {
        path: 'news/:slug',
        loadComponent: () =>
          import('./features/news/news-detail.component').then((m) => m.NewsDetailComponent),
      },
      {
        path: 'programs',
        loadComponent: () =>
          import('./features/programs/programs.component').then((m) => m.ProgramsComponent),
      },
      {
        path: 'partners',
        loadComponent: () =>
          import('./features/partners/partners.component').then((m) => m.PartnersComponent),
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./features/resources/resources.component').then((m) => m.ResourcesComponent),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/contact/contact.component').then((m) => m.ContactComponent),
      },
      {
        path: 'mentions-legales',
        loadComponent: () =>
          import('./features/legal/legal-mentions.component').then(
            (m) => m.LegalMentionsComponent,
          ),
      },
      {
        path: 'politique-confidentialite',
        loadComponent: () =>
          import('./features/legal/privacy-policy.component').then(
            (m) => m.PrivacyPolicyComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];