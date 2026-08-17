import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { SiteConfig } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private readonly configSignal = signal<SiteConfig | null>(null);
  readonly config = this.configSignal.asReadonly();

  constructor(private readonly api: ApiGatewayService) {}

  load(): void {
    this.api.get<SiteConfig>('/site-config').subscribe({
      next: (config) => this.configSignal.set(config),
      error: () => this.configSignal.set(null),
    });
  }

  getPublic(): Observable<SiteConfig> {
    return this.api.get<SiteConfig>('/site-config');
  }

  update(data: Partial<SiteConfig>): Observable<SiteConfig> {
    return this.api.put<SiteConfig>('/site-config', data).pipe(
      tap((config) => this.configSignal.set(config)),
    );
  }
}