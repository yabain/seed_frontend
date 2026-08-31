import { Injectable, inject, signal } from '@angular/core';
import { BannerService } from './banner.service';
import type { Banner } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PageBackgroundService {
  private readonly bannerService = inject(BannerService);

  private readonly backgroundSignal = signal('');
  readonly background = this.backgroundSignal.asReadonly();

  private started = false;
  private finished = false;

  load(): void {
    if (this.finished || this.started) {
      return;
    }
    this.started = true;
    this.bannerService.getPublic().subscribe({
      next: (banner: Banner) => {
        this.backgroundSignal.set(banner.pageBackgroundImage ?? '');
        this.finished = true;
      },
      error: () => {
        this.finished = true;
      },
    });
  }
}
