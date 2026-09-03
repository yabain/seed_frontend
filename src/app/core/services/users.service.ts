import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { UserRole } from '../constants/roles';
import type {
  AdminUser,
  UsersListResult,
  UserLogsResult,
  UserStats,
} from '../models/models';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  notifyContact: boolean;
  siteUrl?: string;
}

export type UpdateUserPayload = Partial<
  Omit<CreateUserPayload, 'password'> & { password?: string }
>;

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly api: ApiGatewayService) {}

  getUsersList(page: number, limit: number, search?: string, status?: string): Observable<UsersListResult> {
    const params: Record<string, string | number> = { page, limit };
    if (search) params['search'] = search;
    if (status) params['status'] = status;
    return this.api.get<UsersListResult>('/admin/users', params);
  }

  getUserStats(): Observable<{ stats: UserStats }> {
    return this.api.get<{ stats: UserStats }>('/admin/users/stats');
  }

  getUser(id: string): Observable<AdminUser> {
    return this.api.get<AdminUser>(`/admin/users/${id}`);
  }

  getUserLogs(id: string, page: number, limit: number): Observable<UserLogsResult> {
    return this.api.get<UserLogsResult>(`/admin/users/${id}/logs`, { page, limit });
  }

  createUser(data: CreateUserPayload): Observable<AdminUser> {
    return this.api.post<AdminUser>('/admin/users', data);
  }

  updateUser(id: string, data: UpdateUserPayload): Observable<AdminUser> {
    return this.api.patch<AdminUser>(`/admin/users/${id}`, data);
  }

  changePassword(id: string, password: string): Observable<{ updated: boolean }> {
    return this.api.patch<{ updated: boolean }>(`/admin/users/${id}/password`, { password });
  }

  removeUser(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/admin/users/${id}`);
  }

  toggleUserActive(id: string): Observable<AdminUser> {
    return this.api.patch<AdminUser>(`/admin/users/${id}/toggle-active`, {});
  }
}
