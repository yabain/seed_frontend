import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';

export interface ProspectItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface ProspectPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export interface ProspectListResult {
  data: ProspectItem[];
  pagination: ProspectPagination;
}

@Injectable({ providedIn: 'root' })
export class ProspectsService {
  constructor(private readonly api: ApiGatewayService) {}

  subscribe(data: { name?: string; email: string; phone?: string }): Observable<ProspectItem> {
    return this.api.post<ProspectItem>('/prospects/subscribe', data);
  }

  list(page = 1, limit = 25, keyword?: string): Observable<ProspectListResult> {
    const params: Record<string, string | number> = { page, limit };
    if (keyword) params['keyword'] = keyword;
    return this.api.get<ProspectListResult>('/prospects', params);
  }

  create(data: { name?: string; email: string; phone?: string }): Observable<ProspectItem> {
    return this.api.post<ProspectItem>('/prospects', data);
  }

  update(id: string, data: { name?: string; email: string; phone?: string }): Observable<ProspectItem> {
    return this.api.patch<ProspectItem>(`/prospects/${id}`, data);
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/prospects/${id}`);
  }
}
