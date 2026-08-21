import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsService } from '../../core/services/news.service';
import { ProgramsService } from '../../core/services/programs.service';
import { PartnersService } from '../../core/services/partners.service';
import { BannerService } from '../../core/services/banner.service';
import { AboutService } from '../../core/services/about.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { ProspectsService } from '../../core/services/prospects.service';
import type { News, Partner, Program, Banner, SiteAbout } from '../../core/models/models';

interface Figure {
  value: string;
  label: string;
  icon: string;
}

interface Feature {
  title: string;
  text: string;
  icon: string;
}

interface Countries {
  name: string;
  flagUrl: string
}

interface Slide {
  eyebrow: string;
  title: string;
  subtitle: string;
  img?: string;
}

const SLIDE_INTERVAL = 8000;
const FALLBACK_PARTNERS: Partner[] = [
  { _id: '1', name: 'Yaba-In SARL' },
  { _id: '2', name: 'Acteurs locaux' },
  { _id: '3', name: 'ONG partenaires' },
  { _id: '4', name: 'Écoles associées' },
  { _id: '5', name: 'Communautés' },
];
const FALLBACK_SLIDES: Slide[] = [
  {
    eyebrow: '',
    title: '',
    subtitle:
      '',
  },
  {
    eyebrow: '',
    title: '',
    subtitle:
      '',
  },
  {
    eyebrow: '',
    title: '',
    subtitle:
      '',
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly siteConfig = this.siteConfigService.config;

  readonly latestNews = signal<News[]>([]);
  readonly newsCanPrev = signal(false);
  readonly newsCanNext = signal(false);
  readonly programs = signal<Program[]>([]);
  readonly partners = signal<Partner[]>([]);
  readonly banner = signal<Banner | null>(null);
  readonly about = signal<SiteAbout | null>(null);
  readonly loading = signal(true);

  readonly newsletterSubmitting = signal(false);
  readonly newsletterSuccess = signal('');
  readonly newsletterError = signal('');

  readonly newsletterForm = { name: '', email: '', phone: '' };

  readonly slides = signal<Slide[]>(FALLBACK_SLIDES);
  readonly activeSlide = signal(0);
  readonly marqueeItems = signal<Partner[]>(FALLBACK_PARTNERS);
  readonly showScrollTop = signal(false);

  @ViewChild('marqueeContainer') marqueeContainer!: ElementRef<HTMLDivElement>;

  private marqueeRaf: number = 0;
  private marqueePaused = false;
  private heroEl: HTMLElement | null = null;

  readonly figures: Figure[] = [
    { value: '50+', label: 'Projets soutenus', icon: 'fa-solid fa-layer-group' },
    { value: '300+', label: 'Emplois crée en Afrique', icon: 'fa-solid fa-users' },
    { value: '30+', label: 'Mentors expert', icon: 'fa-solid fa-handshake' },
    { value: '80+', label: 'Fondateurs dévoués', icon: 'fa-solid fa-seedling' },
  ];

  readonly features: Feature[] = [
    {
      title: 'Éducation et égalité des chances',
      text: 'Des programmes d’alphabétisation, de bourses et de formation pour offrir à chacun les mêmes opportunités.',
      icon: 'fa-solid fa-graduation-cap',
    },
    {
      title: 'Protection de l’environnement',
      text: 'Reboisement, sensibilisation climatique et agriculture durable pour préserver notre planète.',
      icon: 'fa-solid fa-leaf',
    },
    {
      title: 'Entrepreneuriat et autonomisation',
      text: 'Accompagnement des jeunes et des femmes dans la création d’activités génératrices de revenus.',
      icon: 'fa-solid fa-rocket',
    },
    {
      title: 'Santé et bien-être communautaire',
      text: 'Campagnes de prévention, accès aux soins locaux et soutien aux personnes vulnérables.',
      icon: 'fa-solid fa-heart-pulse',
    },
  ];

  readonly countries: Countries[] = [
    {
      name: 'Cameroon',
      flagUrl: '../../../assets/flags/cameroon.avif',
    },
    {
      name: 'Benin',
      flagUrl: '../../../assets/flags/benin.avif',
    },
    {
      name: 'Gabon',
      flagUrl: '../../../assets/flags/gabon.avif',
    },
    {
      name: 'togo',
      flagUrl: '../../../assets/flags/togo.avif',
    },
  ];

  private timer: ReturnType<typeof setInterval> | undefined;
  private raf = 0;
  private parallaxEls: HTMLElement[] = [];
  private readonly reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  phrases: string[] = [
    "semons les graines de l'innovation",
    "révélons le potentiel des entrepreneurs",
    "connectons les talents",
    "bâtissons des entreprises durables",
    "soutenons activement les femmes",
  ];

  currentStep = signal(0);
  isTransitioning = signal(true);
  private timer2: any;

  get totalSteps(): number {
    return this.phrases.length;
  }

  trackHeight(): number {
    return this.phrases.length * 2;
  }

  centerPhraseIndex(): number {
    return this.currentStep() + 2;
  }

  constructor(
    private readonly newsService: NewsService,
    private readonly programsService: ProgramsService,
    private readonly partnersService: PartnersService,
    private readonly bannerService: BannerService,
    private readonly aboutService: AboutService,
    private readonly siteConfigService: SiteConfigService,
    private readonly prospectsService: ProspectsService,
    private readonly elementRef: ElementRef,
  ) { }

  ngOnInit(): void {
    // Fait défiler le texte toutes les 2.5 secondes
    this.timer2 = setInterval(() => {
      this.nextGroup();
    }, 5000);

    this.bannerService.getPublic().subscribe({
      next: (banner) => this.banner.set(banner),
      error: () => this.banner.set(null),
      complete: () => this.buildSlides(),
    });

    this.aboutService.getPublic().subscribe({
      next: (about) => this.about.set(about),
      error: () => this.about.set(null),
    });

    this.newsService.getLatest(10).subscribe({
      next: (items) => {
        this.latestNews.set(items);
        requestAnimationFrame(() => {
          this.setupReveal();
          this.resetNewsScroll();
          this.updateNewsArrows();
        });
      },
      error: () => this.latestNews.set([]),
      complete: () => this.buildSlides(),
    });

    this.programsService.getPublic().subscribe({
      next: (items) => this.programs.set(items.slice(0, 4)),
      error: () => this.programs.set([]),
    });

    this.partnersService.getPublic().subscribe({
      next: (items) => {
        this.partners.set(items);
        const partners = items.filter((p) => p.isActive ?? true);
        this.marqueeItems.set(partners.length ? partners : FALLBACK_PARTNERS);
      },
      error: () => this.marqueeItems.set(FALLBACK_PARTNERS),
      complete: () => {
        this.loading.set(false);
        this.setupReveal();
        this.buildSlides();
        this.startMarqueeAutoScroll();
      },
    });

    this.buildSlides();

    if (!this.reduceMotion) {
      this.timer = setInterval(() => this.next(), SLIDE_INTERVAL);
    }
  }

  nextGroup(): void {
    this.isTransitioning.set(true);
    this.currentStep.update((prev) => prev + 1);

    // Quand on dépasse le dernier groupe, reset instantané vers le premier
    if (this.currentStep() === this.totalSteps) {
      setTimeout(() => {
        this.isTransitioning.set(false); // Coupe la transition CSS
        this.currentStep.set(0);          // Reviens au groupe 0
      }, 600); // Durée alignée sur la transition CSS
    }
  }

  ngAfterViewInit(): void {
    this.heroEl = (this.elementRef.nativeElement as Element).querySelector<HTMLElement>('.lq-hero');
    this.updateScrollTop();
    this.setupReveal();
    this.parallaxEls = Array.from(
      (this.elementRef.nativeElement as Element).querySelectorAll<HTMLElement>('.parallax'),
    );
    this.resetNewsScroll();
    this.updateNewsArrows();
    setTimeout(() => {
      this.updateNewsArrows();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
    if (this.timer2) {
      clearInterval(this.timer2);
    }
    if (this.marqueeRaf) {
      cancelAnimationFrame(this.marqueeRaf);
    }
  }

  private startMarqueeAutoScroll(): void {
    const container = this.marqueeContainer?.nativeElement;
    if (!container) return;

    const step = () => {
      if (!this.marqueePaused) {
        container.scrollBy({ left: 1, behavior: 'auto' });
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) {
          container.scrollLeft = 0;
        }
      }
      this.marqueeRaf = requestAnimationFrame(step);
    };

    this.marqueeRaf = requestAnimationFrame(step);
  }

  pauseMarquee(): void {
    this.marqueePaused = true;
  }

  resumeMarquee(): void {
    this.marqueePaused = false;
  }

  private buildSlides(): void {
    const images = this.latestNews()
      .map((n) => n.image)
      .filter((img): img is string => !!img);

    const dbSlides = this.banner()?.slides;
    if (dbSlides?.length) {
      this.slides.set(
        dbSlides.map((slide, index) => ({
          eyebrow: slide.eyebrow || FALLBACK_SLIDES[index]?.eyebrow || '',
          title: slide.title || FALLBACK_SLIDES[index]?.title || '',
          subtitle: slide.subtitle || FALLBACK_SLIDES[index]?.subtitle || '',
          img: slide.image || images[index],
        })),
      );
      return;
    }

    this.slides.set(
      FALLBACK_SLIDES.map((slide, index) => ({
        ...slide,
        img: images[index],
      })),
    );
  }

  next(): void {
    this.activeSlide.update((i) => (i + 1) % this.slides().length);
  }

  goTo(index: number): void {
    this.activeSlide.set(index);
    if (this.timer) {
      clearInterval(this.timer);
      if (!this.reduceMotion) {
        this.timer = setInterval(() => this.next(), SLIDE_INTERVAL);
      }
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.updateScrollTop();
    if (this.reduceMotion || !this.parallaxEls.length || this.raf) {
      return;
    }
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      const y = window.scrollY;
      this.parallaxEls.forEach((el) => {
        const speed = Number(el.dataset['speed'] || 0.2);
        el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
      });
    });
  }

  private updateScrollTop(): void {
    const threshold = this.heroEl?.offsetHeight ?? window.innerHeight;
    this.showScrollTop.set(window.scrollY > threshold);
  }

  scrollTop(): void {
    window.scrollTo({ top: 0, behavior: this.reduceMotion ? 'auto' : 'smooth' });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateNewsArrows();
  }

  @HostListener('window:pageshow')
  onPageShow(): void {
    this.resetNewsScroll();
    this.updateNewsArrows();
  }

  scrollNews(direction: 1 | -1): void {
    const viewport = this.newsViewport();
    if (!viewport) {
      return;
    }
    const card = viewport.querySelector<HTMLElement>('.lq-newsx__card');
    const gap = 24;
    const step = (card?.offsetWidth ?? viewport.clientWidth) + gap;
    viewport.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  updateNewsArrows(): void {
    const viewport = this.newsViewport();
    if (!viewport) {
      this.newsCanPrev.set(false);
      this.newsCanNext.set(false);
      return;
    }
    const max = viewport.scrollWidth - viewport.clientWidth;
    this.newsCanPrev.set(viewport.scrollLeft > 8);
    this.newsCanNext.set(viewport.scrollLeft < max - 8);
  }

  resetNewsScroll(): void {
    const viewport = this.newsViewport();
    if (viewport) {
      viewport.scrollLeft = 0;
    }
    setTimeout(() => {
      const vp = this.newsViewport();
      if (vp) {
        vp.scrollLeft = 0;
      }
    }, 120);
  }

  private newsViewport(): HTMLElement | null {
    return (this.elementRef.nativeElement as Element).querySelector<HTMLElement>('.lq-newsx__viewport');
  }

  private setupReveal(): void {
    if (this.reduceMotion) {
      return;
    }
    const nodes = document.querySelectorAll<HTMLElement>('.reveal:not(.in-view)');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    nodes.forEach((node) => io.observe(node));
  }

  subscribeNewsletter(): void {
    this.newsletterError.set('');
    this.newsletterSuccess.set('');

    if (!this.newsletterForm.name.trim()) {
      this.newsletterError.set('Le nom est requis.');
      return;
    }

    if (!this.newsletterForm.email) {
      this.newsletterError.set('L’adresse e-mail est requise.');
      return;
    }

    this.newsletterSubmitting.set(true);

    this.prospectsService.subscribe({
      name: this.newsletterForm.name || undefined,
      email: this.newsletterForm.email,
      phone: this.newsletterForm.phone || undefined,
    }).subscribe({
      next: () => {
        this.newsletterSubmitting.set(false);
        this.newsletterSuccess.set('Merci ! Vous êtes inscrit à notre lettre d\'information.');
        this.newsletterForm.name = '';
        this.newsletterForm.email = '';
        this.newsletterForm.phone = '';
      },
      error: () => {
        this.newsletterSubmitting.set(false);
        this.newsletterError.set('Impossible de vous inscrire. Veuillez réessayer.');
      },
    });
  }

  formatDate(iso?: string): string {
    if (!iso) {
      return '';
    }
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatShortDate(iso?: string): string {
    if (!iso) {
      return '';
    }
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  categoryLabel(categories?: string[]): string {
    if (!categories?.length) {
      return 'Actualité';
    }
    return categories.length > 1
      ? `${categories[0]} +${categories.length - 1}`
      : categories[0];
  }

  openNewTab(url?: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

}