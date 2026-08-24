import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiGatewayService } from './api-gateway.service';

export type AnnouncementStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'failed';

export type AnnouncementGroup =
  | 'all_accounts'
  | 'all_users'
  | 'all_consultants'
  | 'all_admins'
  | 'all_prospects';

export interface AnnouncementAttachment {
  fileName: string;
  path: string;
  size: number;
}

export interface AnnouncementDelivery {
  email: string;
  userName?: string;
  userPhone?: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  error?: string;
  sentAt?: string | null;
}

export interface AnnouncementCounts {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

export interface Announcement {
  id: string;
  subject: string;
  bodyHtml: string;
  recipientGroup: AnnouncementGroup;
  customRecipients: string[];
  status: AnnouncementStatus;
  scheduledAt?: string | null;
  sentAt?: string | null;
  includeHeader?: boolean;
  includeFooter?: boolean;
  error?: string;
  lastRunAt?: string | null;
  attachments?: AnnouncementAttachment[];
  deliveries?: AnnouncementDelivery[];
  counts?: AnnouncementCounts;
  groupLabel?: string;
  statusLabel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementsStats {
  total: number;
  draft: number;
  scheduled: number;
  sending: number;
  sent: number;
  failed: number;
}

export interface AnnouncementsListResult {
  data: Announcement[];
  stats: AnnouncementsStats;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface AnnouncementSettings {
  id: string;
  headerHtml: string;
  footerHtml: string;
}

export const ANNOUNCEMENT_GROUP_OPTIONS: Array<{
  value: AnnouncementGroup;
  label: string;
}> = [
  { value: 'all_accounts', label: 'Tous les comptes' },
  { value: 'all_users', label: 'Tous les utilisateurs simples' },
  { value: 'all_consultants', label: 'Tous les consultants' },
  { value: 'all_admins', label: 'Tous les administrateurs' },
  { value: 'all_prospects', label: 'Tous les prospects' },
];

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  constructor(
    private readonly api: ApiGatewayService,
    private readonly http: HttpClient,
  ) {}

  list(filters?: {
    status?: string;
    group?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<AnnouncementsListResult> {
    return this.api.get<AnnouncementsListResult>(
      '/admin/announcements',
      filters,
    );
  }

  getOne(id: string): Observable<Announcement> {
    return this.api.get<Announcement>(`/admin/announcements/${id}`);
  }

  create(payload: Partial<Announcement>): Observable<Announcement> {
    return this.api.post<Announcement>('/admin/announcements', payload);
  }

  update(
    id: string,
    payload: Partial<Announcement>,
  ): Observable<Announcement> {
    return this.api.put<Announcement>(`/admin/announcements/${id}`, payload);
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/admin/announcements/${id}`);
  }

  sendNow(id: string): Observable<Announcement> {
    return this.api.post<Announcement>(`/admin/announcements/${id}/send`);
  }

  schedule(id: string, scheduledAt: string): Observable<Announcement> {
    return this.api.post<Announcement>(`/admin/announcements/${id}/schedule`, {
      scheduledAt,
    });
  }

  cancelSchedule(id: string): Observable<Announcement> {
    return this.api.post<Announcement>(
      `/admin/announcements/${id}/cancel-schedule`,
    );
  }

  duplicate(id: string): Observable<Announcement> {
    return this.api.post<Announcement>(`/admin/announcements/${id}/duplicate`);
  }

  getSettings(): Observable<AnnouncementSettings> {
    return this.api.get<AnnouncementSettings>('/admin/announcements/settings');
  }

  updateSettings(
    payload: Partial<AnnouncementSettings>,
  ): Observable<AnnouncementSettings> {
    return this.api.put<AnnouncementSettings>(
      '/admin/announcements/settings',
      payload,
    );
  }

  preview(
    bodyHtml: string,
    includeHeader = true,
    includeFooter = true,
  ): Observable<string> {
    // L'API renvoie le HTML brut (Content-Type texte) : réponse en texte.
    return this.http.post(
      `${environment.apiUrl}/admin/announcements/preview`,
      { bodyHtml, includeHeader, includeFooter },
      { responseType: 'text' },
    );
  }

  uploadAttachment(file: File): Observable<{
    url: string;
    path: string;
    fileName: string;
    size: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{
      url: string;
      path: string;
      fileName: string;
      size: number;
    }>(`${environment.apiUrl}/admin/announcements/attachments`, formData);
  }
}
