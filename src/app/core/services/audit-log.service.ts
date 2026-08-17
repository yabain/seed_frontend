import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { AuditLogEntry, AuditLogsResult } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  constructor(private readonly api: ApiGatewayService) {}

  list(page = 1, limit = 20, filters?: {
    q?: string;
    action?: string;
    actionPrefix?: string;
    resourceType?: string;
    resourceId?: string;
    actorId?: string;
    actorRole?: string;
    statusCode?: string;
    method?: string;
    ip?: string;
    from?: string;
    to?: string;
    sort?: string;
  }): Observable<AuditLogsResult> {
    const params: Record<string, string | number> = { page, limit };
    if (filters?.q) params['q'] = filters.q;
    if (filters?.action) params['action'] = filters.action;
    if (filters?.actionPrefix) params['actionPrefix'] = filters.actionPrefix;
    if (filters?.resourceType) params['resourceType'] = filters.resourceType;
    if (filters?.resourceId) params['resourceId'] = filters.resourceId;
    if (filters?.actorId) params['actorId'] = filters.actorId;
    if (filters?.actorRole) params['actorRole'] = filters.actorRole;
    if (filters?.statusCode) params['statusCode'] = filters.statusCode;
    if (filters?.method) params['method'] = filters.method;
    if (filters?.ip) params['ip'] = filters.ip;
    if (filters?.from) params['from'] = filters.from;
    if (filters?.to) params['to'] = filters.to;
    if (filters?.sort) params['sort'] = filters.sort;
    return this.api.get<AuditLogsResult>('/audit-logs', params);
  }

  getActions(prefix?: string): Observable<{ data: string[] }> {
    const params: Record<string, string> = {};
    if (prefix) params['prefix'] = prefix;
    return this.api.get<{ data: string[] }>('/audit-logs/actions', params);
  }

  getResourceTypes(): Observable<{ data: string[] }> {
    return this.api.get<{ data: string[] }>('/audit-logs/resource-types');
  }
}