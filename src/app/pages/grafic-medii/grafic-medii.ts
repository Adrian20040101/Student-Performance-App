import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { GraficMediiService } from './grafic-medii.service';
import { GraficMediiData } from './grafic-medii.model';

Chart.register(...registerables);

@Component({
  selector: 'app-grafic-medii',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './grafic-medii.html',
  styleUrls: ['./grafic-medii.css'],
  providers: [GraficMediiService]
})
export class GraficMedii {
  options: string[] = [];
  selectedOptions: string[] = [];
  groupedData: Map<string, GraficMediiData> = new Map();
  chart: Chart | null = null;
  loading = false;

  constructor(private graficService: GraficMediiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.graficService.getGroupedData().subscribe({
      next: (data) => {
        this.groupedData = data;
        this.options = Array.from(this.groupedData.keys()).sort();
        this.loading = false;
      },
      error: (err) => {
        console.error('Eroare la încărcarea datelor:', err);
        this.loading = false;
      }
    });
  }

  updateChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const datasets = this.selectedOptions.map((key, index) => {
      const yearMap = this.groupedData.get(key)!;
      const years = Object.keys(yearMap).map(Number).sort();
      const values = years.map(y => yearMap[y]);
      const color = this.getColor(index);

      return {
        label: key,
        data: values,
        borderColor: color,
        backgroundColor: color,
        fill: false,
        tension: 0.2
      };
    });

    const allYears = Array.from(
      new Set(this.selectedOptions.flatMap(opt => Object.keys(this.groupedData.get(opt) || {}).map(Number)))
    ).sort();

    const ctx = (document.getElementById('myChart') as HTMLCanvasElement).getContext('2d');

    this.chart = new Chart(ctx!, {
      type: 'line',
      data: {
        labels: allYears,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Poziția ultimului admis (simulare)',
            font: { size: 18 }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            reverse: false,
            title: {
              display: true,
              text: 'Poziția în clasament'
            }
          },
          x: {
            title: {
              display: true,
              text: 'An'
            }
          }
        }
      }
    });
  }

  getColor(index: number): string {
    const colors = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00'];
    return colors[index % colors.length];
  }
}
