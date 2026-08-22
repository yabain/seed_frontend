import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatsService } from '../../../core/services/stats.service';
import { NewsService } from '../../../core/services/news.service';
import { ResourcesService } from '../../../core/services/resources.service';
import { ProgramsService } from '../../../core/services/programs.service';
import { ContactService } from '../../../core/services/contact.service';
import { TrafficChartComponent } from '../../../shared/components/traffic-chart/traffic-chart.component';
import type { StatsSummary } from '../../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TrafficChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly summary = signal<StatsSummary | null>(null);
  readonly newsTotal = signal<number | null>(null);
  readonly resourcesTotal = signal<number | null>(null);
  readonly programsTotal = signal<number | null>(null);
  readonly unreadMessages = signal<number | null>(null);

  constructor(
    private readonly statsService: StatsService,
    private readonly newsService: NewsService,
    private readonly resourcesService: ResourcesService,
    private readonly programsService: ProgramsService,
    private readonly contactService: ContactService,
  ) {}

  ngOnInit(): void {
    this.statsService.getSummary().subscribe({
      next: (data) => this.summary.set(data),
      error: () => undefined,
    });

    this.newsService.getAll({ limit: 1 }).subscribe({
      next: (res) => this.newsTotal.set(res.total),
      error: () => this.newsTotal.set(0),
    });

    this.resourcesService.getPublished({ limit: 1 }).subscribe({
      next: (res) => this.resourcesTotal.set(res.total),
      error: () => this.resourcesTotal.set(0),
    });

    this.programsService.getAll({ limit: 1 }).subscribe({
      next: (res) => this.programsTotal.set(res.total),
      error: () => this.programsTotal.set(0),
    });

    this.contactService.getMessages({ page: 1, limit: 1 }).subscribe({
      next: (res) => this.unreadMessages.set(res.unreadCount),
      error: () => this.unreadMessages.set(0),
    });
  }
}
