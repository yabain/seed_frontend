import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DonationsService } from '../../core/services/donations.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import type { DonationMethod } from '../../core/models/models';

@Component({
  selector: 'app-donations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './donations.component.html',
  styleUrl: './donations.component.scss',
})
export class DonationsComponent implements OnInit {
  private readonly donationsService = inject(DonationsService);
  private readonly siteConfigService = inject(SiteConfigService);
  readonly siteConfig = this.siteConfigService.config;
  readonly methods = signal<DonationMethod[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.donationsService.getPublic().subscribe({
      next: (items) => this.methods.set(items),
      error: () => this.methods.set([]),
      complete: () => this.loading.set(false),
    });
  }
}