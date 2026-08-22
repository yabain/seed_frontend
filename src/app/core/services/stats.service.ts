import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { DailyStat, StatsSummary, TopPage, TrafficRange } from '../models/models';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly visitorId = this.getVisitorId();

  constructor(private readonly api: ApiGatewayService) {}

  recordVisit(path: string): void {
    void this.api
      .post<void>('/stats/visit', {
        path,
        visitorId: this.visitorId,
        type: 'visit',
        userAgent: navigator.userAgent.slice(0, 500),
        referrer: document.referrer.slice(0, 500),
      })
      .subscribe();
  }

  recordPageView(path: string): void {
    void this.api
      .post<void>('/stats/visit', {
        path,
        visitorId: this.visitorId,
        type: 'pageview',
        userAgent: navigator.userAgent.slice(0, 500),
      })
      .subscribe();
  }

  getSummary(): Observable<StatsSummary> {
    return this.api.get<StatsSummary>('/stats/summary');
  }

  getDaily(days = 14): Observable<DailyStat[]> {
    return this.api.get<DailyStat[]>('/stats/daily', { days });
  }

  getSeries(range: TrafficRange): Observable<DailyStat[]> {
    return this.api.get<DailyStat[]>('/stats/series', { range });
  }

  getTopPages(limit = 8): Observable<TopPage[]> {
    return this.api.get<TopPage[]>('/stats/top-pages', { limit });
  }

  private getVisitorId(): string {
    const key = 'seed_visitor_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, id);
    }
    return id;
  }
}