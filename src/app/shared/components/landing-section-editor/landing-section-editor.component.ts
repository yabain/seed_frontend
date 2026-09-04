import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { isAdminRole } from '../../../core/constants/roles';
import { SiteConfigService } from '../../../core/services/site-config.service';
import { ToastService } from '../../../core/services/toast.service';
import type { LandingSectionText, LandingSections } from '../../../core/models/models';

type LandingSectionKey = keyof LandingSections;

const DEFAULTS: Record<LandingSectionKey, Required<LandingSectionText>> = {
  events: { eyebrow: 'Événements', title: 'Nos rendez-vous', description: 'Retrouvez nos événements à venir et passés.' },
  news: { eyebrow: 'Actualités', title: 'Nos dernières nouvelles', description: 'Suivez notre actualité et nos réalisations.' },
  programs: { eyebrow: 'Nos actions', title: 'Programmes et projets actifs', description: 'Des initiatives concrètes portées avec nos partenaires.' },
  partners: { eyebrow: '', title: '', description: '' },
  resources: { eyebrow: 'Ressources', title: 'Centre de ressources', description: 'Téléchargez nos rapports, guides et documents institutionnels.' },
  team: { eyebrow: 'Notre équipe', title: 'Les personnes qui nous font avancer', description: 'Découvrez les membres engagés au service de nos missions.' },
};

@Component({
  selector: 'app-landing-section-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-section-editor.component.html',
  styleUrl: './landing-section-editor.component.scss',
})
export class LandingSectionEditorComponent implements OnInit {
  @Input({ required: true }) section!: LandingSectionKey;

  readonly expanded = signal(false);
  readonly saving = signal(false);
  readonly content: Required<LandingSectionText> = { eyebrow: '', title: '', description: '' };

  constructor(
    private readonly authService: AuthService,
    private readonly siteConfigService: SiteConfigService,
    private readonly toastService: ToastService,
  ) {}

  get isAdmin(): boolean {
    return isAdminRole(this.authService.admin()?.role);
  }

  ngOnInit(): void {
    if (!this.isAdmin) return;
    this.siteConfigService.getPublic().subscribe({
      next: (config) => Object.assign(this.content, DEFAULTS[this.section], config.landingSections?.[this.section] ?? {}),
      error: () => this.toastService.error('Impossible de charger le texte de la section.'),
    });
  }

  toggle(): void {
    this.expanded.update((value) => !value);
  }

  save(): void {
    this.saving.set(true);
    this.siteConfigService.update({ landingSections: { [this.section]: { ...this.content } } }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toastService.success('En-tête de la section enregistré.');
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error(err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.');
      },
    });
  }
}
