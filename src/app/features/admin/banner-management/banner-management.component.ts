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

const DEFAULT_PHRASES = [
  "semons les graines de l'innovation",
  "révélons le potentiel des entrepreneurs",
  "connectons les talents",
  "bâtissons des entreprises durables",
  "soutenons activement les femmes",
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
  readonly fixedText = signal('');
  readonly rotatingPhrases = signal<string[]>([]);
  readonly rotatingImage = signal('');
  readonly loaded = signal(false);
  readonly savingSlides = signal(false);
  readonly savingRotating = signal(false);

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
        this.fixedText.set(banner.fixedText ?? '');
        this.rotatingPhrases.set(
          banner.rotatingPhrases?.length
            ? [...banner.rotatingPhrases]
            : [...DEFAULT_PHRASES],
        );
        this.rotatingImage.set(banner.rotatingImage ?? '');
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

  saveSlides(): void {
    this.savingSlides.set(true);
    this.bannerService
      .update(this.slides(), this.fixedText(), this.rotatingPhrases(), this.rotatingImage())
      .subscribe({
        next: () => {
          this.savingSlides.set(false);
          this.toastService.success('Slides enregistrés avec succès.');
        },
        error: (err) => {
          this.savingSlides.set(false);
          this.toastService.error(
            err.details?.join(' ') || err.message || "Erreur lors de l'enregistrement.",
          );
        },
      });
  }

  saveRotating(): void {
    this.savingRotating.set(true);
    this.bannerService
      .update(this.slides(), this.fixedText(), this.rotatingPhrases(), this.rotatingImage())
      .subscribe({
        next: () => {
          this.savingRotating.set(false);
          this.toastService.success('Texte rotatif enregistré avec succès.');
        },
        error: (err) => {
          this.savingRotating.set(false);
          this.toastService.error(
            err.details?.join(' ') || err.message || "Erreur lors de l'enregistrement.",
          );
        },
      });
  }

  addPhrase(): void {
    if (this.rotatingPhrases().length >= 10) return;
    this.rotatingPhrases.update((p) => [...p, '']);
  }

  removePhrase(index: number): void {
    this.rotatingPhrases.update((p) => p.filter((_, i) => i !== index));
  }

  updatePhrase(index: number, value: string): void {
    this.rotatingPhrases.update((p) => p.map((item, i) => (i === index ? value : item)));
  }

  trackByIndex(index: number): number {
    return index;
  }
}
