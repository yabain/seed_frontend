import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from '../../../core/services/stats.service';
import type { DailyStat, StatsSummary, TopPage } from '../../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly summary = signal<StatsSummary | null>(null);
  readonly daily = signal<DailyStat[]>([]);
  readonly topPages = signal<TopPage[]>([]);

  constructor(private readonly statsService: StatsService) {}

  ngOnInit(): void {
    this.statsService.getSummary().subscribe({
      next: (data) => this.summary.set(data),
      error: () => undefined,
    });

    this.statsService.getDaily(14).subscribe({
      next: (data) => this.daily.set(data),
      error: () => this.daily.set([]),
    });

    this.statsService.getTopPages(6).subscribe({
      next: (data) => this.topPages.set(data),
      error: () => this.topPages.set([]),
    });
  }

  maxValue(): number {
    const values = this.daily().map((day) => day.pageViews);
    return Math.max(...values, 1);
  }

  barHeight(day: DailyStat): string {
    const ratio: number = day.pageViews / this.maxValue();
    return `${Math.max(ratio * 100, 4)}%`;
  }

  shortLabel(date: string): string {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}