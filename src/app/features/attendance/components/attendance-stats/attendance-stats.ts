import { Component, computed, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { AttendanceChartData } from '../../models/attendance.model';

@Component({
  selector: 'app-attendance-stats',
  imports: [BaseChartDirective, EmptyStateComponent],
  templateUrl: './attendance-stats.html',
  styleUrl: './attendance-stats.css'
})
export class AttendanceStatsComponent {
  readonly chartData = input.required<AttendanceChartData>();
  readonly monthLabel = input('');

  readonly hasData = computed(() => {
    const data = this.chartData();
    return (
      data.dailyRate.data.some((v) => v > 0) ||
      data.lateTrend.data.some((v) => v > 0) ||
      data.departmentSplit.data.some((v) => v > 0)
    );
  });

  readonly barChart = computed<ChartConfiguration<'bar'>>(() => {
    const data = this.chartData().dailyRate;
    return {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.data,
            label: 'Attendance rate %',
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Daily attendance rate' }
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    };
  });

  readonly lineChart = computed<ChartConfiguration<'line'>>(() => {
    const data = this.chartData().lateTrend;
    return {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.data,
            label: 'Late check-ins',
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Late trend' }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    };
  });

  readonly pieChart = computed<ChartConfiguration<'pie'>>(() => {
    const data = this.chartData().departmentSplit;
    const colors = [
      'rgba(99, 102, 241, 0.8)',
      'rgba(14, 165, 233, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(168, 85, 247, 0.8)'
    ];
    return {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.data,
            backgroundColor: data.labels.map((_, i) => colors[i % colors.length])
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Attendance by department' }
        }
      }
    };
  });
}
