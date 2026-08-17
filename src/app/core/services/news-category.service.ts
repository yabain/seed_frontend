import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { NewsCategory } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NewsCategoryService {
  constructor(private readonly api: ApiGatewayService) {}

  getAll(): Observable<NewsCategory[]> {
    return this.api.get<NewsCategory[]>('/news-categories');
  }

  create(data: { name: string }): Observable<NewsCategory> {
    return this.api.post<NewsCategory>('/news-categories', data);
  }

  update(id: string, data: { name: string }): Observable<NewsCategory> {
    return this.api.patch<NewsCategory>(`/news-categories/${id}`, data);
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/news-categories/${id}`);
  }
}