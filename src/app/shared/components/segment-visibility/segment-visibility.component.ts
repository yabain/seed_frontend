import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteConfigService } from '../../../core/services/site-config.service';
import { ToastService } from '../../../core/services/toast.service';
import type { SiteConfig, SiteSegments } from '../../../core/models/models';

export type SegmentKey = keyof SiteSegments;

const SEGMENT_DESCRIPTIONS: Record<SegmentKey, string> = {
  news: 'Affiche ou masque la section « Actualités » sur la page d\'accueil ainsi que le lien du menu.',
  resources:
    'Affiche ou masque la section « Ressources » sur la landing page ainsi que le lien du menu.',
  programs:
    'Affiche ou masque la section « Programmes » sur la page d\'accueil ainsi que le lien du menu.',
  partners:
    'Affiche ou masque la section « Partenaires » sur la page d\'accueil ainsi que le lien du menu.',
  events:
    'Affiche ou masque la section « Événements » sur la page d\'accueil ainsi que le lien du menu.',
};

@Component({
  selector: 'app-segment-visibility',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './segment-visibility.component.html',
  styleUrl: './segment-visibility.component.scss',
})
export class SegmentVisibilityComponent {
  readonly segment = input<SegmentKey>('news');

  private readonly siteConfigService = inject(SiteConfigService);
  private readonly toastService = inject(ToastService);

  readonly checked = computed(
    () => this.siteConfigService.config()?.segments?.[this.segment()] ?? true,
  );

  readonly description = computed(() => SEGMENT_DESCRIPTIONS[this.segment()]);

  toggle(): void {
    const next = !this.checked();
    const payload: Partial<SiteConfig> = {
      segments: { [this.segment()]: next } as unknown as SiteSegments,
    };
    this.siteConfigService.update(payload).subscribe({
      error: () =>
        this.toastService.error('Erreur lors de l’enregistrement de la visibilité.'),
    });
  }
}