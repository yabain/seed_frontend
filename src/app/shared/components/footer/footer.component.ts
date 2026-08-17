import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteConfigService } from '../../../core/services/site-config.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly siteConfig = this.siteConfigService.config;
  readonly currentYear = new Date().getFullYear();

  readonly quickLinks = [
    { label: 'Nos Actions', path: '/programs' },
    { label: 'Partenaires', path: '/partners' },
    { label: 'Ressources', path: '/resources' },
    { label: 'Actualités', path: '/news' },
    { label: 'Contact', path: '/contact' },
  ];

  constructor(private readonly siteConfigService: SiteConfigService) {}

  socialLinks(): Array<{ label: string; url: string; icon: string }> {
    const social = this.siteConfig()?.social ?? {};
    const entries = [
      { label: 'Facebook', icon: 'F', url: social.facebook },
      { label: 'Instagram', icon: 'IG', url: social.instagram },
      { label: 'LinkedIn', icon: 'in', url: social.linkedin },
      { label: 'Twitter', icon: 'X', url: social.twitter },
      { label: 'YouTube', icon: 'YT', url: social.youtube },
    ] as const;
    return entries.filter((entry) => !!entry.url) as Array<{
      label: string;
      url: string;
      icon: string;
    }>;
  }
}