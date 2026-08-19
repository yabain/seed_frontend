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

  socialLinks(): Array<{ label: string; url: string; iconClass: string }> {
    const social = this.siteConfig()?.social ?? {};
    const entries: Array<{ label: string; url?: string; iconClass: string }> = [
      { label: 'Facebook', url: social.facebook, iconClass: 'fa-brands fa-facebook' },
      { label: 'Instagram', url: social.instagram, iconClass: 'fa-brands fa-instagram' },
      { label: 'LinkedIn', url: social.linkedin, iconClass: 'fa-brands fa-linkedin' },
      { label: 'X (Twitter)', url: social.twitter, iconClass: 'fa-brands fa-x-twitter' },
      { label: 'YouTube', url: social.youtube, iconClass: 'fa-brands fa-youtube' },
    ];
    return entries
      .filter((entry) => !!entry.url)
      .map((entry) => ({
        label: entry.label,
        url: entry.url as string,
        iconClass: entry.iconClass,
      }));
  }
}