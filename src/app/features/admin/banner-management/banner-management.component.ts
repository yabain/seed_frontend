import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BannerService } from '../../../core/services/banner.service';
import { FeaturesSectionService } from '../../../core/services/features-section.service';
import { CountriesSectionService } from '../../../core/services/countries-section.service';
import { VideoHighlightSectionService } from '../../../core/services/video-highlight-section.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminImageFieldComponent } from '../../../shared/components/admin-image-field/admin-image-field.component';
import type { BannerFigure, BannerSlide, FeatureItem, FeaturesSection, CountryItem, CountriesSection, VideoHighlightSection } from '../../../core/models/models';

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

const DEFAULT_FEATURES: FeatureItem[] = [
  {
    icon: '',
    name: 'Abolition des frontières du savoir',
    details: 'Un partage d\'expériences direct entre experts internationaux et entrepreneurs locaux.',
  },
  {
    icon: '',
    name: 'Leadership serviteur & éthique',
    details: 'Placer l\'humain, l\'intégrité et l\'impact communautaire au cœur de chaque décision.',
  },
  {
    icon: '',
    name: 'Engagement durable',
    details: 'Suivi post-incubation pour assurer la pérennité et le succès de votre projet.',
  },
];

const DEFAULT_COUNTRIES: CountryItem[] = [
  {
    image: '/assets/flags/cameroon.avif',
    title: 'Cameroon',
    subtitle: '',
  },
  {
    image: '/assets/flags/benin.avif',
    title: 'Benin',
    subtitle: '',
  },
  {
    image: '/assets/flags/gabon.avif',
    title: 'Gabon',
    subtitle: '',
  },
  {
    image: '/assets/flags/togo.avif',
    title: 'Togo',
    subtitle: '',
  },
];

const DEFAULT_FIGURES: BannerFigure[] = [
  { value: '50+', label: 'Projets soutenus' },
  { value: '300+', label: 'Emplois créés en Afrique' },
  { value: '30+', label: 'Mentors experts' },
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
  readonly rotatingVisible = signal(true);
  readonly figures = signal<BannerFigure[]>(DEFAULT_FIGURES.map((figure) => ({ ...figure })));
  readonly authBackgroundImage = signal('');
  readonly featuresEyebrow = signal('');
  readonly featuresTitle = signal('');
  readonly featuresDescription = signal('');
  readonly featuresImage = signal('');
  readonly featuresItems = signal<FeatureItem[]>(DEFAULT_FEATURES.map((f) => ({ ...f })));
  readonly featuresVisible = signal(true);
  readonly countriesTitle = signal('4 Countries');
  readonly countriesBackgroundImage = signal('');
  readonly countriesItems = signal<CountryItem[]>(DEFAULT_COUNTRIES.map((c) => ({ ...c })));
  readonly countriesVisible = signal(true);
  readonly loaded = signal(false);
  readonly savingSlides = signal(false);
  readonly savingRotating = signal(false);
  readonly savingVisibility = signal(false);
  readonly savingFeatures = signal(false);
  readonly savingCountries = signal(false);
  readonly savingLandingExtras = signal(false);
  readonly savingVideoHighlight = signal(false);
  readonly videoHighlight: VideoHighlightSection = { eyebrow: '', title: '', description: '', buttonLabel: 'En savoir plus', buttonLink: '', videoUrl: '', visible: true };

  constructor(
    private readonly bannerService: BannerService,
    private readonly featuresSectionService: FeaturesSectionService,
    private readonly countriesSectionService: CountriesSectionService,
    private readonly videoHighlightSectionService: VideoHighlightSectionService,
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
        this.rotatingVisible.set(banner.rotatingVisible ?? true);
        this.figures.set(banner.figures?.length ? banner.figures.slice(0, 3) : DEFAULT_FIGURES.map((figure) => ({ ...figure })));
        this.authBackgroundImage.set(banner.authBackgroundImage ?? '');
        this.loaded.set(true);
      },
      error: () => {
        this.loaded.set(true);
        this.toastService.error('Impossible de charger la bannière.');
      },
    });

    this.featuresSectionService.getPublic().subscribe({
      next: (section) => {
        this.featuresEyebrow.set(section.eyebrow ?? '');
        this.featuresTitle.set(section.title ?? '');
        this.featuresDescription.set(section.description ?? '');
        this.featuresImage.set(section.image ?? '');
        this.featuresItems.set(
          section.features?.length
            ? section.features.map((f) => ({ ...f }))
            : DEFAULT_FEATURES.map((f) => ({ ...f })),
        );
        this.featuresVisible.set(section.visible ?? true);
      },
      error: () => {
        this.toastService.error('Impossible de charger la section partenaires.');
      },
    });

    this.countriesSectionService.getPublic().subscribe({
      next: (section) => {
        this.countriesTitle.set(section.title ?? '4 Countries');
        this.countriesBackgroundImage.set(section.backgroundImage ?? '');
        this.countriesItems.set(
          section.countries?.length
            ? section.countries.map((c) => ({ ...c }))
            : DEFAULT_COUNTRIES.map((c) => ({ ...c })),
        );
        this.countriesVisible.set(section.visible ?? true);
      },
      error: () => {
        this.toastService.error('Impossible de charger la section pays.');
      },
    });

    this.videoHighlightSectionService.getPublic().subscribe({
      next: (section) => Object.assign(this.videoHighlight, section),
      error: () => this.toastService.error('Impossible de charger la section vidéo.'),
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
      .update(this.slides(), this.fixedText(), this.rotatingPhrases(), this.rotatingImage(), this.rotatingVisible(), this.figures(), this.authBackgroundImage())
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
      .update(this.slides(), this.fixedText(), this.rotatingPhrases(), this.rotatingImage(), this.rotatingVisible(), this.figures(), this.authBackgroundImage())
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

  toggleVisibility(value: boolean): void {
    this.rotatingVisible.set(value);
    this.savingVisibility.set(true);
    this.bannerService
      .update(this.slides(), this.fixedText(), this.rotatingPhrases(), this.rotatingImage(), value, this.figures(), this.authBackgroundImage())
      .subscribe({
        next: () => {
          this.savingVisibility.set(false);
          this.toastService.success(value ? 'Section visible' : 'Section masquée');
        },
        error: (err) => {
          this.savingVisibility.set(false);
          this.rotatingVisible.set(!value);
          this.toastService.error(
            err.details?.join(' ') || err.message || "Erreur lors du changement de visibilité.",
          );
        },
      });
  }

  saveLandingExtras(): void {
    this.savingLandingExtras.set(true);
    this.bannerService
      .update(this.slides(), this.fixedText(), this.rotatingPhrases(), this.rotatingImage(), this.rotatingVisible(), this.figures(), this.authBackgroundImage())
      .subscribe({
        next: () => {
          this.savingLandingExtras.set(false);
          this.toastService.success('Chiffres et image d’authentification enregistrés.');
        },
        error: (err) => {
          this.savingLandingExtras.set(false);
          this.toastService.error(err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.');
        },
      });
  }

  saveVideoHighlight(): void {
    this.savingVideoHighlight.set(true);
    this.videoHighlightSectionService.update(this.videoHighlight).subscribe({
      next: () => { this.savingVideoHighlight.set(false); this.toastService.success('Section vidéo enregistrée.'); },
      error: (err) => { this.savingVideoHighlight.set(false); this.toastService.error(err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.'); },
    });
  }

  addFeature(): void {
    this.featuresItems.update((items) => [...items, { icon: '', name: '', details: '' }]);
  }

  removeFeature(index: number): void {
    this.featuresItems.update((items) => items.filter((_, i) => i !== index));
  }

  updateFeatureName(index: number, value: string): void {
    this.featuresItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, name: value } : item)),
    );
  }

  updateFeatureDetails(index: number, value: string): void {
    this.featuresItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, details: value } : item)),
    );
  }

  saveFeatures(): void {
    this.savingFeatures.set(true);
    this.featuresSectionService
      .update(
        this.featuresEyebrow(),
        this.featuresTitle(),
        this.featuresDescription(),
        this.featuresImage(),
        this.featuresItems(),
        this.featuresVisible(),
      )
      .subscribe({
        next: () => {
          this.savingFeatures.set(false);
          this.toastService.success('Section partenaires enregistrée avec succès.');
        },
        error: (err) => {
          this.savingFeatures.set(false);
          this.toastService.error(
            err.details?.join(' ') || err.message || "Erreur lors de l'enregistrement.",
          );
        },
      });
  }

  toggleFeaturesVisibility(value: boolean): void {
    this.featuresVisible.set(value);
    this.savingFeatures.set(true);
    this.featuresSectionService
      .update(
        this.featuresEyebrow(),
        this.featuresTitle(),
        this.featuresDescription(),
        this.featuresImage(),
        this.featuresItems(),
        value,
      )
      .subscribe({
        next: () => {
          this.savingFeatures.set(false);
          this.toastService.success(value ? 'Section visible' : 'Section masquée');
        },
        error: (err) => {
          this.savingFeatures.set(false);
          this.featuresVisible.set(!value);
          this.toastService.error(
            err.details?.join(' ') || err.message || "Erreur lors du changement de visibilité.",
          );
        },
      });
  }

  addCountry(): void {
    this.countriesItems.update((items) => [...items, { image: '', title: '', subtitle: '' }]);
  }

  removeCountry(index: number): void {
    this.countriesItems.update((items) => items.filter((_, i) => i !== index));
  }

  updateCountryTitle(index: number, value: string): void {
    this.countriesItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, title: value } : item)),
    );
  }

  updateCountrySubtitle(index: number, value: string): void {
    this.countriesItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, subtitle: value } : item)),
    );
  }

  setCountryImage(index: number, url: string): void {
    this.countriesItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, image: url } : item)),
    );
  }

  saveCountries(): void {
    this.savingCountries.set(true);
    this.countriesSectionService
      .update(
        this.countriesTitle(),
        this.countriesBackgroundImage(),
        this.countriesItems(),
        this.countriesVisible(),
      )
      .subscribe({
        next: () => {
          this.savingCountries.set(false);
          this.toastService.success('Section pays enregistrée avec succès.');
        },
        error: (err) => {
          this.savingCountries.set(false);
          this.toastService.error(
            err.details?.join(' ') || err.message || "Erreur lors de l'enregistrement.",
          );
        },
      });
  }

  toggleCountriesVisibility(value: boolean): void {
    this.countriesVisible.set(value);
    this.savingCountries.set(true);
    this.countriesSectionService
      .update(
        this.countriesTitle(),
        this.countriesBackgroundImage(),
        this.countriesItems(),
        value,
      )
      .subscribe({
        next: () => {
          this.savingCountries.set(false);
          this.toastService.success(value ? 'Section visible' : 'Section masquée');
        },
        error: (err) => {
          this.savingCountries.set(false);
          this.countriesVisible.set(!value);
          this.toastService.error(
            err.details?.join(' ') || err.message || "Erreur lors du changement de visibilité.",
          );
        },
      });
  }
}
