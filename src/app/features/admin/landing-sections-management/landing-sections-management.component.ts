import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteConfigService } from '../../../core/services/site-config.service';
import { ToastService } from '../../../core/services/toast.service';
import type { LandingSections } from '../../../core/models/models';

const DEFAULT_SECTIONS: Required<LandingSections> = {
  events: { eyebrow: 'Événements', title: 'Nos rendez-vous', description: 'Retrouvez nos événements à venir et passés.' },
  news: { eyebrow: 'Actualités', title: 'Nos dernières nouvelles', description: 'Suivez notre actualité et nos réalisations.' },
  programs: { eyebrow: 'Nos actions', title: 'Programmes et projets actifs', description: 'Des initiatives concrètes portées avec nos partenaires.' },
  partners: { eyebrow: '', title: '', description: '' },
};

@Component({
  selector: 'app-landing-sections-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-sections-management.component.html',
  styleUrls: ['../management.scss'],
})
export class LandingSectionsManagementComponent implements OnInit {
  readonly loaded = signal(false);
  readonly saving = signal(false);
  readonly sections: Required<LandingSections> = structuredClone(DEFAULT_SECTIONS);

  constructor(
    private readonly siteConfigService: SiteConfigService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.siteConfigService.getPublic().subscribe({
      next: (config) => {
        for (const key of Object.keys(DEFAULT_SECTIONS) as Array<keyof LandingSections>) {
          Object.assign(this.sections[key], config.landingSections?.[key] ?? {});
        }
        this.loaded.set(true);
      },
      error: () => {
        this.loaded.set(true);
        this.toastService.error('Impossible de charger les textes de la landing page.');
      },
    });
  }

  save(): void {
    this.saving.set(true);
    this.siteConfigService.update({ landingSections: structuredClone(this.sections) }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.success('Les sections de la landing page ont été enregistrées.');
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error(err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.');
      },
    });
  }
}
