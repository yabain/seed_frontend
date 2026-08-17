import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
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

interface Slide {
  eyebrow: string;
  title: string;
  subtitle: string;
  img?: string;
}

const SLIDE_INTERVAL = 8000;
const FALLBACK_PARTNERS = [
  'Yaba-In SARL',
  'Acteurs locaux',
  'ONG partenaires',
  'Écoles associées',
  'Communautés',
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
  readonly newsInset = signal('');
  readonly programs = signal<Program[]>([]);
  readonly partners = signal<Partner[]>([]);
  readonly banner = signal<Banner | null>(null);
  readonly about = signal<SiteAbout | null>(null);
  readonly loading = signal(true);

  readonly newsletterSubmitting = signal(false);
  readonly newsletterSuccess = signal('');
  readonly newsletterError = signal('');

  readonly newsletterForm = { name: '', email: '' };

  readonly slides = signal<Slide[]>(FALLBACK_SLIDES);
  readonly activeSlide = signal(0);
  readonly marqueeItems = signal<string[]>(FALLBACK_PARTNERS);

  readonly figures: Figure[] = [
    { value: '10 000+', label: 'Bénéficiaires accompagnés', icon: 'fa-solid fa-users' },
    { value: '4', label: 'Domaines d’intervention', icon: 'fa-solid fa-layer-group' },
    { value: '50+', label: 'Partenaires & acteurs engagés', icon: 'fa-solid fa-handshake' },
    { value: '15', label: 'Projets et programmes actifs', icon: 'fa-solid fa-seedling' },
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

  private timer: ReturnType<typeof setInterval> | undefined;
  private raf = 0;
  private parallaxEls: HTMLElement[] = [];
  private readonly reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(
    private readonly newsService: NewsService,
    private readonly programsService: ProgramsService,
    private readonly partnersService: PartnersService,
    private readonly bannerService: BannerService,
    private readonly aboutService: AboutService,
    private readonly siteConfigService: SiteConfigService,
    private readonly prospectsService: ProspectsService,
    private readonly elementRef: ElementRef,
  ) {}

  ngOnInit(): void {
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
          this.measureNewsGutter();
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
        const names = items.map((p) => p.name).filter(Boolean);
        this.marqueeItems.set(names.length ? [...names, ...names].slice(0, 10) : FALLBACK_PARTNERS);
      },
      error: () => this.marqueeItems.set(FALLBACK_PARTNERS),
      complete: () => {
        this.loading.set(false);
        this.setupReveal();
        this.buildSlides();
      },
    });

    this.buildSlides();

    if (!this.reduceMotion) {
      this.timer = setInterval(() => this.next(), SLIDE_INTERVAL);
    }
  }

  ngAfterViewInit(): void {
    this.setupReveal();
    this.parallaxEls = Array.from(
      (this.elementRef.nativeElement as Element).querySelectorAll<HTMLElement>('.parallax'),
    );
    this.measureNewsGutter();
    this.resetNewsScroll();
    this.updateNewsArrows();
    setTimeout(() => {
      this.measureNewsGutter();
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

  @HostListener('window:resize')
  onResize(): void {
    this.measureNewsGutter();
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

  measureNewsGutter(): void {
    const host = this.elementRef.nativeElement as Element;
    const head = host.querySelector<HTMLElement>('.lq-newsx__head');
    const viewport = host.querySelector<HTMLElement>('.lq-newsx__viewport');
    if (!head || !viewport) {
      return;
    }
    const inset = head.getBoundingClientRect().left - viewport.getBoundingClientRect().left;
    this.newsInset.set(`${Math.max(0, inset)}px`);
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

    if (!this.newsletterForm.email) {
      this.newsletterError.set('L’adresse e-mail est requise.');
      return;
    }

    this.newsletterSubmitting.set(true);

    this.prospectsService.subscribe({
      name: this.newsletterForm.name || undefined,
      email: this.newsletterForm.email,
    }).subscribe({
      next: () => {
        this.newsletterSubmitting.set(false);
        this.newsletterSuccess.set('Merci ! Vous êtes inscrit à notre lettre d\'information.');
        this.newsletterForm.name = '';
        this.newsletterForm.email = '';
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
      month: 'short',
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
}