import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { SeedEvent, Paginated } from '../models/models';

export type PaginationQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

@Injectable({ providedIn: 'root' })
export class EventsService {
  constructor(private readonly api: ApiGatewayService) {}

  getPublic(query: PaginationQuery = {}): Observable<Paginated<SeedEvent>> {
    return this.api.get<Paginated<SeedEvent>>('/events', query);
  }

  getVisibleOnLanding(): Observable<SeedEvent[]> {
    return this.api.get<SeedEvent[]>('/events/landing');
  }

  getLatest(limit = 3): Observable<SeedEvent[]> {
    return this.api.get<SeedEvent[]>('/events/latest', { limit });
  }

  getAll(query: PaginationQuery = {}): Observable<Paginated<SeedEvent>> {
    return this.api.get<Paginated<SeedEvent>>('/events/all', query);
  }

  getOne(id: string): Observable<SeedEvent> {
    return this.api.get<SeedEvent>(`/events/${id}`);
  }

  create(data: Partial<SeedEvent>): Observable<SeedEvent> {
    return this.api.post<SeedEvent>('/events', data);
  }

  update(id: string, data: Partial<SeedEvent>): Observable<SeedEvent> {
    return this.api.patch<SeedEvent>(`/events/${id}`, data);
  }

  toggleVisibility(id: string): Observable<SeedEvent> {
    return this.api.patch<SeedEvent>(`/events/${id}/toggle-visibility`, {});
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/events/${id}`);
  }
}
