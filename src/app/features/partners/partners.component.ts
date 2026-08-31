import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PartnersService } from '../../core/services/partners.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { PageBackgroundService } from '../../core/services/page-background.service';
import type { Partner } from '../../core/models/models';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './partners.component.html',
  styleUrl: './partners.component.scss',
})
export class PartnersComponent implements OnInit {
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly pageBackgroundService = inject(PageBackgroundService);
  readonly siteConfig = this.siteConfigService.config;
  readonly pageBackground = this.pageBackgroundService.background;
  readonly partners = signal<Partner[]>([]);
  readonly loading = signal(true);

  constructor(private readonly partnersService: PartnersService) {}

  ngOnInit(): void {
    this.pageBackgroundService.load();
    this.partnersService.getPublic().subscribe({
      next: (items) => this.partners.set(items),
      error: () => this.partners.set([]),
      complete: () => this.loading.set(false),
    });
  }
}