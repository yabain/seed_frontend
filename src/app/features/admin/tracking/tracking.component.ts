import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from '../../../core/services/stats.service';
import { TrafficChartComponent } from '../../../shared/components/traffic-chart/traffic-chart.component';
import type { StatsSummary, TopPage } from '../../../core/models/models';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, TrafficChartComponent],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.scss',
})
export class TrackingComponent implements OnInit {
  readonly summary = signal<StatsSummary | null>(null);
  readonly topPages = signal<TopPage[]>([]);

  constructor(private readonly statsService: StatsService) {}

  ngOnInit(): void {
    this.statsService.getSummary().subscribe({
      next: (data) => this.summary.set(data),
      error: () => undefined,
    });

    this.statsService.getTopPages(6).subscribe({
      next: (data) => this.topPages.set(data),
      error: () => this.topPages.set([]),
    });
  }
}
