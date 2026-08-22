import { Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { SiteConfig } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private readonly document = inject(DOCUMENT);
  private readonly api: ApiGatewayService;

  private readonly configSignal = signal<SiteConfig | null>(null);
  readonly config = this.configSignal.asReadonly();

  constructor(api: ApiGatewayService) {
    this.api = api;
  }

  load(): void {
    this.api.get<SiteConfig>('/site-config').subscribe({
      next: (config) => {
        this.configSignal.set(config);
        this.applyDocumentMeta(config);
      },
      error: () => this.configSignal.set(null),
    });
  }

  getPublic(): Observable<SiteConfig> {
    return this.api.get<SiteConfig>('/site-config');
  }

  update(data: Partial<SiteConfig>): Observable<SiteConfig> {
    return this.api.put<SiteConfig>('/site-config', data).pipe(
      tap((config) => {
        this.configSignal.set(config);
        this.applyDocumentMeta(config);
      }),
    );
  }

  private applyDocumentMeta(config: SiteConfig): void {
    if (config.favicon) {
      let link = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = this.document.createElement('link');
        link.setAttribute('rel', 'icon');
        this.document.head.appendChild(link);
      }
      link.href = config.favicon;
    }

    const title = [config.orgName, config.tagline].filter((part) => part?.trim()).join(' — ');
    if (title) {
      this.upsertMeta('property', 'og:title', title);
    }
    const description = config.description?.trim();
    if (description) {
      this.upsertMeta('property', 'og:description', description);
      this.upsertMeta('name', 'description', description);
    }
    if (config.ogImage) {
      this.upsertMeta('property', 'og:image', config.ogImage);
      this.upsertMeta('property', 'og:image:width', '1200');
      this.upsertMeta('property', 'og:image:height', '630');
    }
    this.upsertMeta('property', 'og:type', 'website');
    this.upsertMeta('name', 'twitter:card', 'summary_large_image');
    if (config.ogImage) {
      this.upsertMeta('name', 'twitter:image', config.ogImage);
    }
  }

  private upsertMeta(attr: 'property' | 'name', key: string, content: string): void {
    let meta = this.document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!meta) {
      meta = this.document.createElement('meta');
      meta.setAttribute(attr, key);
      this.document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }
}
