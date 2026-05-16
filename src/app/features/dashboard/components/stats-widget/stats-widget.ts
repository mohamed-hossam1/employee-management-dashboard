import { Component, input } from '@angular/core';

export interface StatsWidgetTrend {
  direction: 'up' | 'down';
  percent: number;
}

@Component({
  selector: 'app-stats-widget',
  imports: [],
  templateUrl: './stats-widget.html',
  styleUrl: './stats-widget.css'
})
export class StatsWidgetComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input<string | number>(0);
  readonly trend = input<StatsWidgetTrend | null>(null);
  readonly accent = input<'brand' | 'success' | 'warning' | 'danger' | 'info'>('brand');
}
