import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BannerService } from '../../../core/services/banner.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminImageFieldComponent } from '../../../shared/components/admin-image-field/admin-image-field.component';
import type { BannerSlide } from '../../../core/models/models';

const EMPTY_SLIDES: BannerSlide[] = [
  { eyebrow: '', title: '', subtitle: '', image: '' },
  { eyebrow: '', title: '', subtitle: '', image: '' },
  { eyebrow: '', title: '', subtitle: '', image: '' },
];

@Component({
  selector: 'app-banner-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminImageFieldComponent],
  templateUrl: './banner-management.component.html',
  styleUrl: './banner-management.component.scss',
})
export class BannerManagementComponent implements OnInit {
  readonly activeTab = signal(0);
  readonly slides = signal<BannerSlide[]>(EMPTY_SLIDES.map((s) => ({ ...s })));
  readonly loaded = signal(false);
  readonly saving = signal(false);

  constructor(
    private readonly bannerService: BannerService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.bannerService.getPublic().subscribe({
      next: (banner) => {
        const source = banner.slides ?? [];
        this.slides.set(
          EMPTY_SLIDES.map((defaults, index) => ({
            eyebrow: source[index]?.eyebrow ?? defaults.eyebrow,
            title: source[index]?.title ?? defaults.title,
            subtitle: source[index]?.subtitle ?? defaults.subtitle,
            image: source[index]?.image ?? defaults.image,
          })),
        );
        this.loaded.set(true);
      },
      error: () => {
        this.loaded.set(true);
        this.toastService.error('Impossible de charger la bannière.');
      },
    });
  }

  setImage(index: number, url: string): void {
    this.slides.update((items) =>
      items.map((slide, i) => (i === index ? { ...slide, image: url } : slide)),
    );
  }

  save(index: number): void {
    this.saving.set(true);

    this.bannerService.update(this.slides()).subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.success(`Slide ${index + 1} enregistré avec succès.`);
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.',
        );
      },
    });
  }
}