import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { GraficMediiService } from './grafic-medii.service';
import { GraficMediiData } from './grafic-medii.model';
import { RouterModule } from '@angular/router';

Chart.register(...registerables);

@Component({
  selector: 'app-grafic-medii',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './grafic-medii.html',
  styleUrls: ['./grafic-medii.css'],
  providers: [GraficMediiService]
})
export class GraficMedii implements AfterViewInit {
  options: string[] = [];
  selectedOptions: string[] = [];
  groupedData: Map<string, GraficMediiData> = new Map();
  chart: Chart | null = null;
  loading = false;

  @ViewChild('myChart', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;

  constructor(private graficService: GraficMediiService) {}

  ngAfterViewInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.graficService.getGroupedData().subscribe({
      next: data => {
        this.groupedData = data;
        this.options = Array.from(this.groupedData.keys()).sort();
        this.loading = false;
      },
      error: err => {
        console.error('Eroare la încărcarea datelor:', err);
        this.loading = false;
      }
    });
  }

  updateChart(): void {
    if (!this.selectedOptions.length) {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      return;
    }

    setTimeout(() => {
      if (this.chart) this.chart.destroy();

      const datasets = this.selectedOptions.map((key, index) => {
        const yearMap = this.groupedData.get(key)!;
        const years = Object.keys(yearMap).map(Number).sort();
        const values = years.map(y => yearMap[y]);
        const color = this.getColor(index);

        const ctx = this.chartRef.nativeElement.getContext('2d')!;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color + '33');
        gradient.addColorStop(1, color + '00');

        return {
          label: key,
          data: values,
          borderColor: color,
          backgroundColor: gradient,
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: color
        };
      });

      const allYears = Array.from(
        new Set(this.selectedOptions.flatMap(opt => Object.keys(this.groupedData.get(opt) || {}).map(Number)))
      ).sort();

      const ctx = this.chartRef.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chart = new Chart(ctx, {
        type: 'line',
        data: { labels: allYears, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Poziția ultimului admis (simulare)',
              font: { size: 18 }
            },
            legend: {
              position: 'top',
              labels: {
                boxWidth: 20,
                padding: 15,
                usePointStyle: true
              }
            },
            tooltip: {
              enabled: true,
              mode: 'nearest',
              intersect: false,
              callbacks: {
                title: function() {
                  return '';
                },
                label: function(context) {
                  const positionValue = context.parsed.y;
                  const datasetLabel = context.dataset.label || '';

                  if (positionValue > 0) {
                    return [datasetLabel, `Ultima Poziție: ${positionValue}`];
                  }
                  return [datasetLabel];
                }
              }
            },
            datalabels: {
              display: false
            }
          },
          interaction: { mode: 'nearest', intersect: false },
          scales: {
            y: {
              beginAtZero: false,
              reverse: false,
              title: { display: true, text: 'Poziția în clasament' },
              grid: { color: '#e0e0e0' }
            },
            x: {
              title: { display: true, text: 'An' },
              grid: { color: '#f0f0f0' }
            }
          }
        }
      });
    });
  }

  getColor(index: number): string {
    const colors = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00'];
    return colors[index % colors.length];
  }

  toggleOption(opt: string) {
    const idx = this.selectedOptions.indexOf(opt);
    if (idx > -1) {
      this.selectedOptions.splice(idx, 1);
    } else {
      this.selectedOptions.push(opt);
    }
    this.updateChart();
  }

}
