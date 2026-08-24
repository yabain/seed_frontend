import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteConfigService } from '../../core/services/site-config.service';

@Component({
  selector: 'app-legal-mentions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './legal-mentions.component.html',
  styleUrl: './legal.component.scss',
})
export class LegalMentionsComponent {
  readonly siteConfig = inject(SiteConfigService).config;
}
