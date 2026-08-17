import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { Partner } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PartnersService {
  constructor(private readonly api: ApiGatewayService) {}

  getPublic(): Observable<Partner[]> {
    return this.api.get<Partner[]>('/partners');
  }

  getAll(): Observable<Partner[]> {
    return this.api.get<Partner[]>('/partners/all');
  }

  getOne(id: string): Observable<Partner> {
    return this.api.get<Partner>(`/partners/${id}`);
  }

  create(data: Partial<Partner>): Observable<Partner> {
    return this.api.post<Partner>('/partners', data);
  }

  update(id: string, data: Partial<Partner>): Observable<Partner> {
    return this.api.patch<Partner>(`/partners/${id}`, data);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/partners/${id}`);
  }
}