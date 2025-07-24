import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Chart, ArcElement, Tooltip, Legend, ChartOptions, ChartType } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {Options} from 'chartjs-plugin-datalabels/types/options';
import {FormsModule} from '@angular/forms';
import {NgForOf} from '@angular/common';

Chart.register(ArcElement, Tooltip, Legend, ChartDataLabels);

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    datalabels?: Options | undefined;
  }
}

interface BacData {
  unitate: string;
  specializare: string;
  media: number;
}

@Component({
  selector: 'app-statistici',
  templateUrl: './statistici.html',
  imports: [
    FormsModule,
    NgForOf
  ],
  styleUrls: ['./statistici.css']
})
export class Statistici implements OnInit, AfterViewInit {

  allData: BacData[] = [];
  chart: Chart | undefined;

  unitateSelectata = '';
  specializareSelectata = '';

  unitati: string[] = [];
  specializari: string[] = [];

  totalEleviText = 'Se încarcă date...';

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.fetchData();
  }

  async fetchData(): Promise<void> {
    const response = await fetch('https://ionutb.github.io/simulare-evaluare2025/data.json');
    const raw = await response.json();

    const headers = raw[0];
    const rows = raw.slice(1);

    const idxUnitate = headers.indexOf('Unitatea de învăţământ');
    const idxSpecializare = headers.indexOf('Specializare');
    const idxMedia = headers.indexOf('Media');
    const idxRezultat = headers.indexOf('Rezultatul final');

    const parsed = rows
      .map((row: any[]) => {
        const unitate = row[idxUnitate];
        const specializare = row[idxSpecializare];
        const rezultat = (row[idxRezultat] || '').toLowerCase();
        let media = parseFloat(row[idxMedia]);

        if (rezultat.includes('respins')) {
          media = 3;
        } else if (!rezultat.includes('reusit')) {
          media = 0;
        } else if (isNaN(media)) {
          media = 0;
        }

        return { unitate, specializare, media };
      })
      .filter((r: BacData) => r.unitate && r.unitate.endsWith('Brașov'));

    this.allData = parsed;

    this.populateDropdowns();
    this.updateChart();
  }

  populateDropdowns(): void {
    const unitStats: Record<string, { total: number; peste9: number }> = {};

    this.allData.forEach(({ unitate, media }) => {
      if (!unitStats[unitate]) {
        unitStats[unitate] = { total: 0, peste9: 0 };
      }
      unitStats[unitate].total++;
      if (media >= 9) unitStats[unitate].peste9++;
    });

    const sortedUnitati = Object.entries(unitStats)
      .map(([nume, stats]) => ({
        nume,
        procent: (stats.peste9 / stats.total) * 100
      }))
      .sort((a, b) => b.procent - a.procent);

    this.unitati = sortedUnitati.map(u => u.nume);

    this.specializari = Array.from(new Set(this.allData.map(d => d.specializare))).sort();
  }

  onUnitateChange(unit: string): void {
    this.unitateSelectata = unit;

    const filteredData = this.unitateSelectata
      ? this.allData.filter(d => d.unitate === this.unitateSelectata)
      : this.allData;

    this.specializari = Array.from(new Set(filteredData.map(d => d.specializare))).sort();

    this.specializareSelectata = '';

    this.updateChart();
  }

  onSpecializareChange(spec: string): void {
    this.specializareSelectata = spec;
    this.updateChart();
  }

  updateChart(): void {
    const filtered = this.allData.filter(d =>
      (!this.unitateSelectata || d.unitate === this.unitateSelectata) &&
      (!this.specializareSelectata || d.specializare === this.specializareSelectata)
    );

    const intervals = [0, 0, 0, 0, 0, 0];

    filtered.forEach(({ media }) => {
      if (media === 0) {
        intervals[0]++;
      } else if (media < 6) {
        intervals[1]++;
      } else if (media < 7) {
        intervals[2]++;
      } else if (media < 8) {
        intervals[3]++;
      } else if (media < 9) {
        intervals[4]++;
      } else {
        intervals[5]++;
      }
    });

    const labels = [
      'Neprezentat',
      'Respins',
      '6–7',
      '7–8',
      '8–9',
      '9–11'
    ];

    const colors = [
      '#8e0000', //neprezentat
      '#e57373', //respins
      '#fff176', // 6–7
      '#dce775', // 7–8
      '#66bb6a', // 8–9
      '#1b5e20'  // 9–11
    ];

    const ctx = (document.getElementById('chart') as HTMLCanvasElement).getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: intervals,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          datalabels: {
            color: '#fff',
            font: {
              weight: 'bold',
              size: 14,
            },
            formatter: (value: number, context: any) => {
              if (value === 0) return '';
              const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
              const percent = ((value / total) * 100).toFixed(1);
              return `${value} elevi\n${percent}%`;
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const val = context.raw as number;
                const label = context.label as string;
                return `${label}: ${val} elevi`;
              }
            }
          },
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Distribuția mediilor pe intervale'
          }
        }
      },
      plugins: [ChartDataLabels]
    });

    const totalElevi = filtered.length;
    let text = `Total elevi selectați: ${totalElevi}`;
    if (totalElevi > 0) {
      const medieGenerala = (filtered.reduce((sum, e) => sum + e.media, 0) / totalElevi).toFixed(2);
      text += ` | Media generală: ${medieGenerala}`;
    }
    this.totalEleviText = text;
  }
}
