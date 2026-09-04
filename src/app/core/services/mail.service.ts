import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';

export interface SmtpConfig {
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  smtpEncryption: string;
  status: boolean;
  emailForAlert: string;
}

export interface EmailItem {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  status: boolean;
  category: 'single' | 'announcement';
  groupId?: string;
  sentCount: number;
  totalCount: number;
  createdAt: string;
}

export interface EmailMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  success: number;
  failed: number;
}

export interface EmailListResult {
  data: EmailItem[];
  meta: EmailMeta;
}

export interface EmailStat {
  month: string;
  success: number;
  failed: number;
}

@Injectable({ providedIn: 'root' })
export class MailService {
  constructor(private readonly api: ApiGatewayService) {}

  getSmtpData(): Observable<SmtpConfig> {
    return this.api.get<SmtpConfig>('/smtp');
  }

  updateSmtp(data: Partial<SmtpConfig>): Observable<SmtpConfig> {
    return this.api.put<SmtpConfig>('/smtp/update', data);
  }

  resetSmtp(): Observable<SmtpConfig> {
    return this.api.get<SmtpConfig>('/smtp/reset');
  }

  sendTestMail(to: string, subject: string, message: string): Observable<boolean> {
    return this.api.post<boolean>('/email/send-test', { to, subject, message });
  }

  getOutputMails(
    page: number,
    keyword?: string,
    limit = 10,
  ): Observable<EmailListResult> {
    const params: Record<string, string | number> = { page, limit };
    if (keyword) params['keyword'] = keyword;
    return this.api.get<EmailListResult>('/email', params);
  }

  getStatistics(): Observable<EmailStat[]> {
    return this.api.get<EmailStat[]>('/email/get-statistics');
  }
}
