import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgramsService } from '../../core/services/programs.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { PageBackgroundService } from '../../core/services/page-background.service';
import type { Program } from '../../core/models/models';

const ICONS: Record<string, string> = {
  education: 'fa-solid fa-graduation-cap',
  environment: 'fa-solid fa-earth-americas',
  entrepreneurship: 'fa-solid fa-rocket',
  health: 'fa-solid fa-heart-pulse',
};

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.scss',
})
export class ProgramsComponent implements OnInit {
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly pageBackgroundService = inject(PageBackgroundService);
  readonly siteConfig = this.siteConfigService.config;
  readonly pageBackground = this.pageBackgroundService.background;
  readonly programs = signal<Program[]>([]);
  readonly loading = signal(true);

  constructor(private readonly programsService: ProgramsService) {}

  ngOnInit(): void {
    this.pageBackgroundService.load();
    this.programsService.getPublic().subscribe({
      next: (items) => this.programs.set(items),
      error: () => this.programs.set([]),
      complete: () => this.loading.set(false),
    });
  }

  iconFor(program: Program): string {
    return program.icon && ICONS[program.icon]
      ? ICONS[program.icon]
      : 'fa-solid fa-seedling';
  }
}