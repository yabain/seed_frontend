import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { News, Paginated } from '../models/models';

export type PaginationQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

@Injectable({ providedIn: 'root' })
export class NewsService {
  constructor(private readonly api: ApiGatewayService) {}

  // Espace public
  getPublished(query: PaginationQuery = {}): Observable<Paginated<News>> {
    return this.api.get<Paginated<News>>('/news', query);
  }

  getLatest(limit = 3): Observable<News[]> {
    return this.api.get<News[]>('/news/latest', { limit });
  }

  getBySlug(slug: string): Observable<News> {
    return this.api.get<News>(`/news/slug/${slug}`);
  }

  // Back-office
  getAll(query: { status?: string } & PaginationQuery = {}): Observable<Paginated<News>> {
    return this.api.get<Paginated<News>>('/news/all', query);
  }

  getOne(id: string): Observable<News> {
    return this.api.get<News>(`/news/${id}`);
  }

  create(data: Partial<News>): Observable<News> {
    return this.api.post<News>('/news', data);
  }

  update(id: string, data: Partial<News>): Observable<News> {
    return this.api.patch<News>(`/news/${id}`, data);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/news/${id}`);
  }
}