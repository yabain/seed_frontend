import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PartnersService } from '../../core/services/partners.service';
import type { Partner } from '../../core/models/models';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './partners.component.html',
  styleUrl: './partners.component.scss',
})
export class PartnersComponent implements OnInit {
  readonly partners = signal<Partner[]>([]);
  readonly loading = signal(true);

  constructor(private readonly partnersService: PartnersService) {}

  ngOnInit(): void {
    this.partnersService.getPublic().subscribe({
      next: (items) => this.partners.set(items),
      error: () => this.partners.set([]),
      complete: () => this.loading.set(false),
    });
  }
}