import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { Paginated, Resource } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ResourcesService {
  constructor(private readonly api: ApiGatewayService) {}

  // Espace public
  getPublished(query: { page?: number; limit?: number; category?: string } = {}): Observable<
    Paginated<Resource>
  > {
    return this.api.get<Paginated<Resource>>('/resources', query);
  }

  getCategories(): Observable<string[]> {
    return this.api.get<string[]>('/resources/categories');
  }

  // Back-office
  getAll(
    query: { page?: number; limit?: number; search?: string } = {},
  ): Observable<Paginated<Resource>> {
    return this.api.get<Paginated<Resource>>('/resources', query);
  }

  getOne(id: string): Observable<Resource> {
    return this.api.get<Resource>(`/resources/${id}`);
  }

  create(data: Partial<Resource>): Observable<Resource> {
    return this.api.post<Resource>('/resources', data);
  }

  update(id: string, data: Partial<Resource>): Observable<Resource> {
    return this.api.patch<Resource>(`/resources/${id}`, data);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/resources/${id}`);
  }
}