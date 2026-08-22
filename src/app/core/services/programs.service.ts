import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { Paginated, Program } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProgramsService {
  constructor(private readonly api: ApiGatewayService) {}

  getPublic(): Observable<Program[]> {
    return this.api.get<Program[]>('/programs');
  }

  getAll(
    query: { page?: number; limit?: number; search?: string } = {},
  ): Observable<Paginated<Program>> {
    return this.api.get<Paginated<Program>>('/programs/all', query);
  }

  getOne(id: string): Observable<Program> {
    return this.api.get<Program>(`/programs/${id}`);
  }

  create(data: Partial<Program>): Observable<Program> {
    return this.api.post<Program>('/programs', data);
  }

  update(id: string, data: Partial<Program>): Observable<Program> {
    return this.api.patch<Program>(`/programs/${id}`, data);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/programs/${id}`);
  }
}