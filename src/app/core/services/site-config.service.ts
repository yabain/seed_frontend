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
        this.applyTheme(config);
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
        this.applyTheme(config);
      }),
    );
  }

  private applyTheme(config: SiteConfig): void {
    const root = this.document.documentElement;
    const primary = this.normalizeHex(config.primaryColor);
    const secondary = this.normalizeHex(config.secondaryColor);

    if (primary) {
      root.style.setProperty('--color-primary', primary);
      root.style.setProperty('--color-primary-dark', this.shade(primary, -14));
      root.style.setProperty('--color-primary-darker', this.shade(primary, -28));
      root.style.setProperty('--color-accent', this.shade(primary, -28));
      root.style.setProperty('--color-accent-dark', this.shade(primary, -42));
      root.style.setProperty('--color-primary-light', this.shade(primary, 10));
      root.style.setProperty('--color-primary-lighter', this.shade(primary, 78));
      root.style.setProperty('--bs-primary-rgb', this.toRgbTriplet(primary));
    } else {
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-primary-dark');
      root.style.removeProperty('--color-primary-darker');
      root.style.removeProperty('--color-accent');
      root.style.removeProperty('--color-accent-dark');
      root.style.removeProperty('--color-primary-light');
      root.style.removeProperty('--color-primary-lighter');
      root.style.removeProperty('--bs-primary-rgb');
    }

    if (secondary) {
      root.style.setProperty('--color-secondary', secondary);
    } else {
      root.style.removeProperty('--color-secondary');
    }
  }

  private normalizeHex(value?: string | null): string | null {
    const raw = value?.trim();
    if (!raw) {
      return null;
    }
    const short = /^#([0-9A-Fa-f]{3})$/.exec(raw);
    if (short) {
      return '#' + short[1].split('').map((c) => c + c).join('').toLowerCase();
    }
    return /^#[0-9A-Fa-f]{6}$/.test(raw) ? raw.toLowerCase() : null;
  }

  private toRgbTriplet(hex: string): string {
    const num = parseInt(hex.slice(1), 16);
    return `${(num >> 16) & 0xff}, ${(num >> 8) & 0xff}, ${num & 0xff}`;
  }

  private shade(hex: string, percent: number): string {
    const num = parseInt(hex.slice(1), 16);
    const amount = Math.round(2.55 * percent);
    const channel = (value: number) =>
      Math.min(255, Math.max(0, value + amount));
    const r = channel((num >> 16) & 0xff)
      .toString(16)
      .padStart(2, '0');
    const g = channel((num >> 8) & 0xff)
      .toString(16)
      .padStart(2, '0');
    const b = channel(num & 0xff)
      .toString(16)
      .padStart(2, '0');
    return `#${r}${g}${b}`;
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
      this.document.title = title;
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
