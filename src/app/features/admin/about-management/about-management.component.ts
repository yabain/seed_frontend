import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AboutService } from '../../../core/services/about.service';
import type { ErrorMessage } from '../../../core/interceptors/error.interceptor';
import type { SiteAbout, SiteConfig } from '../../../core/models/models';
import { SiteConfigService } from '../../../core/services/site-config.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminImageFieldComponent } from '../../../shared/components/admin-image-field/admin-image-field.component';

@Component({
  selector: 'app-about-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminImageFieldComponent],
  templateUrl: './about-management.component.html',
  styleUrls: ['../management.scss', './about-management.component.scss'],
})
export class AboutManagementComponent implements OnInit {
  readonly loaded = signal(false);
  readonly saving = signal(false);
  readonly savingTexts = signal(false);
  readonly savingLogo = signal(false);

  readonly config: Partial<SiteConfig> = {
    orgName: '',
    tagline: '',
    description: '',
    logo: '',
    address: '',
    phone: '',
    phone2: '',
    email: '',
    social: {
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
      youtube: '',
    },
  };

  readonly form: SiteAbout = {
    _id: '',
    mission: '',
    vision: '',
    values: ['', '', ''],
  };

  constructor(
    private readonly aboutService: AboutService,
    private readonly siteConfigService: SiteConfigService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.siteConfigService.getPublic().subscribe({
      next: (config) => {
        Object.assign(this.config, config);
        this.config.social = {
          facebook: '',
          instagram: '',
          linkedin: '',
          twitter: '',
          youtube: '',
          ...config.social,
        };
      },
      error: () => undefined,
    });

    this.aboutService.getPublic().subscribe({
      next: (about) => {
        Object.assign(this.form, about);
        this.form.values = [
          about.values?.[0] ?? '',
          about.values?.[1] ?? '',
          about.values?.[2] ?? '',
        ];
        this.loaded.set(true);
      },
      error: () => {
        this.loaded.set(true);
        this.toastService.error('Impossible de charger le contenu « À propos ».');
      },
    });
  }

  setLogo(url: string): void {
    this.config.logo = url;
    this.savingLogo.set(true);

    this.siteConfigService.update({ logo: url }).subscribe({
      next: () => {
        this.savingLogo.set(false);
        this.siteConfigService.load();
        this.toastService.success('Logo enregistré avec succès.');
      },
      error: (err: ErrorMessage) => {
        this.savingLogo.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement du logo.',
        );
      },
    });
  }

  saveTexts(): void {
    this.savingTexts.set(true);

    const payload: Partial<SiteConfig> = {
      orgName: this.config.orgName,
      tagline: this.config.tagline,
      description: this.config.description,
      logo: this.config.logo ?? '',
      address: this.config.address,
      phone: this.config.phone,
      phone2: this.config.phone2,
      email: this.config.email,
      social: { ...this.config.social },
    };

    this.siteConfigService.update(payload).subscribe({
      next: () => {
        this.savingTexts.set(false);
        this.siteConfigService.load();
        this.toastService.success('Textes et réseaux enregistrés avec succès.');
      },
      error: (err) => {
        this.savingTexts.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.',
        );
      },
    });
  }

  save(): void {
    this.saving.set(true);

    this.aboutService
      .update({
        mission: this.form.mission.trim(),
        vision: this.form.vision.trim(),
        values: this.form.values.map((value) => value.trim()),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toastService.success('Contenu « À propos » enregistré avec succès.');
        },
        error: (err) => {
          this.saving.set(false);
          this.toastService.error(
            err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.',
          );
        },
      });
  }
}