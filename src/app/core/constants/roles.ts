export const USER_ROLES = ['user', 'consultant', 'admin', 'superadmin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_ROLES: readonly UserRole[] = ['admin', 'superadmin'];

export const CONTENT_ROLES: readonly UserRole[] = [
  'user',
  'consultant',
  'admin',
  'superadmin',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Utilisateur',
  consultant: 'Consultant',
  admin: 'Administrateur',
  superadmin: 'Super-admin',
};

export function isAdminRole(role: UserRole | string | undefined | null): boolean {
  return !!role && (role === 'admin' || role === 'superadmin');
}
