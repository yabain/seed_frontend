import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgramsService } from '../../core/services/programs.service';
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
  readonly programs = signal<Program[]>([]);
  readonly loading = signal(true);

  constructor(private readonly programsService: ProgramsService) {}

  ngOnInit(): void {
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