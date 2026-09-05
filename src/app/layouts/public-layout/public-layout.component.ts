import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { SiteConfigService } from '../../core/services/site-config.service';
import { StatsService } from '../../core/services/stats.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly statsService = inject(StatsService);
  private readonly router = inject(Router);

  /** Vrai sur la landing page (host sur laquelle on n'affiche pas la grille). */
  readonly isHome = signal(false);

  constructor() {
    this.siteConfigService.load();
    this.trackRoute();
    this.trackVisits();
  }

  private trackRoute(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      )
      .subscribe((event) => {
        this.isHome.set(event.urlAfterRedirects === '/');
      });
  }

  private trackVisits(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      )
      .subscribe((event) => {
        this.statsService.recordVisit(event.urlAfterRedirects || '/');
        this.statsService.recordPageView(event.urlAfterRedirects || '/');
      });
  }
}