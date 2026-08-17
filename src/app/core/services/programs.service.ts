import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { Program } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProgramsService {
  constructor(private readonly api: ApiGatewayService) {}

  getPublic(): Observable<Program[]> {
    return this.api.get<Program[]>('/programs');
  }

  getAll(): Observable<Program[]> {
    return this.api.get<Program[]>('/programs/all');
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