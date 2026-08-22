import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from '../../../core/services/stats.service';
import type { DailyStat, TrafficRange } from '../../../core/models/models';

interface ChartPoint {
  x: number;
  y: number;
  value: number;
}

@Component({
  selector: 'app-traffic-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './traffic-chart.component.html',
  styleUrl: './traffic-chart.component.scss',
})
export class TrafficChartComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly HEIGHT = 260;
  private static readonly PAD = { l: 48, r: 16, t: 36, b: 38 };

  readonly ranges: { value: TrafficRange; label: string }[] = [
    { value: '24h', label: '24 h' },
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '12m', label: '12 mois' },
  ];

  readonly range = signal<TrafficRange>('24h');
  readonly data = signal<DailyStat[]>([]);
  readonly loading = signal(false);
  readonly width = signal(720);

  @ViewChild('plotWrap') private wrap?: ElementRef<HTMLElement>;
  private resizeObserver?: ResizeObserver;

  constructor(private readonly statsService: StatsService) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    const el = this.wrap?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) this.width.set(Math.round(w));
    });
    this.resizeObserver.observe(el);
    this.width.set(Math.max(320, Math.round(el.clientWidth)));
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  setRange(range: TrafficRange): void {
    if (range === this.range()) return;
    this.range.set(range);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.statsService.getSeries(this.range()).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.data.set([]);
        this.loading.set(false);
      },
    });
  }

  /* ---------- Géométrie ---------- */

  get height(): number {
    return TrafficChartComponent.HEIGHT;
  }

  get pad(): typeof TrafficChartComponent.PAD {
    return TrafficChartComponent.PAD;
  }

  maxValue(): number {
    return Math.max(...this.data().map((d) => d.pageViews), 0);
  }

  ticks(): number[] {
    const max = this.maxValue();
    if (max <= 0) return [0, 1, 2, 3, 4];
    const raw = max / 4;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const unit = ([1, 2, 2.5, 5, 10] as const).find((u) => u * pow >= raw) ?? 10;
    const step = unit * pow;
    return [0, 1, 2, 3, 4].map((i) => i * step);
  }

  private niceMax(): number {
    const t = this.ticks();
    return t[t.length - 1] || 1;
  }

  y(value: number): number {
    const { t, b } = TrafficChartComponent.PAD;
    const plotH = TrafficChartComponent.HEIGHT - t - b;
    const plotBottom = TrafficChartComponent.HEIGHT - b;
    const ratio = value / this.niceMax();
    return Math.round(plotBottom - ratio * plotH);
  }

  x(index: number): number {
    const { l, r } = TrafficChartComponent.PAD;
    const n = this.data().length;
    if (n <= 1) return l;
    const plotW = this.width() - l - r;
    return Math.round(l + (index / (n - 1)) * plotW);
  }

  points(): ChartPoint[] {
    return this.data().map((d, i) => ({
      x: this.x(i),
      y: this.y(d.pageViews),
      value: d.pageViews,
    }));
  }

  linePath(): string {
    const pts = this.points().map((p) => ({ x: p.x, y: p.y }));
    if (!pts.length) return '';
    if (pts.length < 3) {
      return pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
    }
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = +(p1.x + (p2.x - p0.x) / 6).toFixed(2);
      const c1y = +(p1.y + (p2.y - p0.y) / 6).toFixed(2);
      const c2x = +(p2.x - (p3.x - p1.x) / 6).toFixed(2);
      const c2y = +(p2.y - (p3.y - p1.y) / 6).toFixed(2);
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  xLabels(): { x: number; label: string; anchor: string }[] {
    const items = this.data();
    const step = Math.max(1, Math.ceil(items.length / 12));
    const out: { x: number; label: string; anchor: string }[] = [];
    items.forEach((d, i) => {
      if (i % step !== 0 && i !== items.length - 1) return;
      out.push({
        x: this.x(i),
        label: this.barLabel(d.date),
        anchor: i === 0 ? 'start' : i === items.length - 1 ? 'end' : 'middle',
      });
    });
    return out;
  }

  anchorFor(index: number): string {
    const last = this.points().length - 1;
    if (index <= 0) return 'start';
    if (index >= last) return 'end';
    return 'middle';
  }

  dyFor(): string {
    return '-10';
  }

  fmtTick(v: number): string {
    if (v >= 10000) return `${+(v / 1000).toFixed(1)}k`;
    return `${v}`;
  }

  fmtValue(v: number): string {
    return v.toLocaleString('fr-FR');
  }

  barLabel(date: string): string {
    const range = this.range();

    if (range === '24h') {
      return `${date.slice(11, 13)}h`;
    }

    if (range === '12m') {
      const [y, m] = date.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', {
        month: 'short',
        year: '2-digit',
      });
    }

    const [yr, mo, d] = date.split('-').map(Number);
    return new Date(yr, mo - 1, d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: range === '30d' ? undefined : 'short',
    });
  }

  emptyMessage(): string {
    switch (this.range()) {
      case '24h':
        return 'Pas encore de visites sur les dernières 24 heures.';
      case '30d':
        return 'Pas encore de données sur les 30 derniers jours.';
      case '12m':
        return 'Pas encore de données sur les 12 derniers mois.';
      default:
        return 'Pas encore de données de fréquentation.';
    }
  }
}
