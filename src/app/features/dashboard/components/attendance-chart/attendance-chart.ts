import { Component, computed, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { DashboardChartData } from '../../state/dashboard.state';

@Component({
  selector: 'app-attendance-chart',
  imports: [BaseChartDirective, EmptyStateComponent],
  templateUrl: './attendance-chart.html',
  styleUrl: './attendance-chart.css'
})
export class AttendanceChartComponent {
  readonly chartData = input.required<DashboardChartData>();

  readonly hasData = computed(() => {
    const data = this.chartData();
    return (
      data.weeklyAttendance.data.some((v) => v > 0) ||
      data.departmentDistribution.data.some((v) => v > 0) ||
      data.employeeGrowth.data.some((v) => v > 0)
    );
  });

  readonly barChart = computed<ChartConfiguration<'bar'>>(() => {
    const series = this.chartData().weeklyAttendance;
    return {
      type: 'bar',
      data: {
        labels: series.labels,
        datasets: [
          {
            data: series.data,
            label: 'Attendance rate %',
            backgroundColor: 'rgba(99, 102, 241, 0.75)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Weekly attendance rate' }
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    };
  });

  readonly pieChart = computed<ChartConfiguration<'pie'>>(() => {
    const series = this.chartData().departmentDistribution;
    const colors = [
      'rgba(99, 102, 241, 0.85)',
      'rgba(14, 165, 233, 0.85)',
      'rgba(34, 197, 94, 0.85)',
      'rgba(245, 158, 11, 0.85)',
      'rgba(239, 68, 68, 0.85)',
      'rgba(168, 85, 247, 0.85)'
    ];
    return {
      type: 'pie',
      data: {
        labels: series.labels,
        datasets: [
          {
            data: series.data,
            backgroundColor: series.labels.map((_, i) => colors[i % colors.length])
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Employees by department' }
        }
      }
    };
  });

  readonly lineChart = computed<ChartConfiguration<'line'>>(() => {
    const series = this.chartData().employeeGrowth;
    return {
      type: 'line',
      data: {
        labels: series.labels,
        datasets: [
          {
            data: series.data,
            label: 'Employees',
            borderColor: 'rgb(14, 165, 233)',
            backgroundColor: 'rgba(14, 165, 233, 0.15)',
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
          title: { display: true, text: 'Employee growth' }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    };
  });
}
