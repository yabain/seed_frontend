import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { DonationMethod } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DonationsService {
  constructor(private readonly api: ApiGatewayService) {}

  getPublic(): Observable<DonationMethod[]> {
    return this.api.get<DonationMethod[]>('/donations');
  }

  getAll(): Observable<DonationMethod[]> {
    return this.api.get<DonationMethod[]>('/donations/all');
  }

  getOne(id: string): Observable<DonationMethod> {
    return this.api.get<DonationMethod>(`/donations/${id}`);
  }

  create(data: Partial<DonationMethod>): Observable<DonationMethod> {
    return this.api.post<DonationMethod>('/donations', data);
  }

  update(id: string, data: Partial<DonationMethod>): Observable<DonationMethod> {
    return this.api.patch<DonationMethod>(`/donations/${id}`, data);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/donations/${id}`);
  }

  toggleActive(id: string): Observable<DonationMethod> {
    return this.api.patch<DonationMethod>(`/donations/${id}/toggle`);
  }
}