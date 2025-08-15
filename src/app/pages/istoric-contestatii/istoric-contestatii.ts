import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

Chart.register(...registerables);

interface Contestatie {
  name: string;
  ri: number;
  ra: number | null;
}

interface ContestationStatistics {
  total: number;
  crescute: number;
  scazute: number;
  neschimbat: number;
  mediaDiferenta: string;
}

@Component({
  selector: 'app-istoric-contestatii',
  templateUrl: './istoric-contestatii.html',
  styleUrls: ['./istoric-contestatii.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class IstoricContestatii implements OnInit, AfterViewInit {
  statisticsError: string | null = null;
  statistics: ContestationStatistics = {
    total: 0,
    crescute: 0,
    scazute: 0,
    neschimbat: 0,
    mediaDiferenta: '0',
  };

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  chartInstance: Chart | null = null;

  selectedChart: 'evolutie' | 'devierea' | 'differencesFrequency' = 'evolutie';

  labels: string[] = [];
  riValues: number[] = [];
  raValues: number[] = [];
  deviation: number[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  loadData(): void {
    this.http.get<Contestatie[]>('https://ionutb.github.io/simulare-evaluare2025/note.json').subscribe({
      next: (data) => {
        const contested = data.filter(e => e.ra !== null).sort((a, b) => a.ri - b.ri);

        this.labels = contested.map(e => e.name);
        this.riValues = contested.map(e => e.ri);
        this.raValues = contested.map(e => e.ra as number);
        this.deviation = contested.map(e => (e.ra as number) - e.ri);

        const total = contested.length;
        this.statistics.total = total;
        this.statistics.crescute = contested.filter(e => (e.ra as number) > e.ri).length;
        this.statistics.scazute = contested.filter(e => (e.ra as number) < e.ri).length;
        this.statistics.neschimbat = contested.filter(e => (e.ra as number) === e.ri).length;
        this.statistics.mediaDiferenta = total > 0
          ? (contested.reduce((acc, e) => acc + ((e.ra as number) - e.ri), 0) / total).toFixed(3)
          : '0';

        this.renderChart();
      },
      error: (err) => this.statisticsError = `Eroare la încărcarea contestatii.json: ${err.message}`
    });
  }

  toggleChart(chart: 'evolutie' | 'devierea' | 'differencesFrequency') {
    this.selectedChart = chart;
    this.renderChart();
  }

  renderChart() {
    if (!this.chartCanvas) return;
    if (this.chartInstance) this.chartInstance.destroy();

    if (this.selectedChart === 'evolutie') {
      this.chartInstance = new Chart(this.chartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: this.labels,
          datasets: [
            { label: 'Nota inițială (ri)', data: this.riValues, borderColor: 'blue', fill: false, tension: 0.1, pointRadius: 0 },
            { label: 'Nota după contestație (ra)', data: this.raValues, borderColor: 'green', fill: false, tension: 0.1, pointRadius: 0 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { font: { size: 14 } } },
            title: { display: true, text: 'Evoluția notelor la română (ri vs ra)', font: { size: 20 } },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
            },
            datalabels: { display: false }
          },
          elements: { point: { radius: 0 } },
          scales: { y: { beginAtZero: false } }
        }
      });
    } else if (this.selectedChart === 'devierea') {
  this.chartInstance = new Chart(this.chartCanvas.nativeElement, {
    type: 'bar',
    data: {
      labels: this.labels,
      datasets: [{
        label: 'Diferență (ra - ri)',
        data: this.deviation,
        backgroundColor: this.deviation.map(v => v >= 0 ? 'green' : 'red')
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Devierea față de nota inițială (ra - ri)', font: { size: 20 } },
        legend: { labels: { font: { size: 14 } } },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => {
              const idx = context.dataIndex ?? 0;
              const ri = this.riValues[idx];
              const ra = this.raValues[idx];
              const diff = this.deviation[idx];
              return [
                `Inițial: ${ri.toFixed(2)}`,
                `Contestată: ${ra.toFixed(2)}`,
                `Diferență: ${diff.toFixed(2)}`
              ];
            }
          }
        },
        datalabels: { display: false }
      },
      scales: { y: { beginAtZero: false } }
    }
  });
} else if (this.selectedChart === 'differencesFrequency') {
  const freqMap: Record<string, number> = {};
  this.deviation.forEach(d => {
    const key = d.toFixed(2);
    freqMap[key] = (freqMap[key] || 0) + 1;
  });
  const keys = Object.keys(freqMap).sort((a, b) => parseFloat(a) - parseFloat(b));
  const values = keys.map(k => freqMap[k]);

  this.chartInstance = new Chart(this.chartCanvas.nativeElement, {
    type: 'bar',
    data: { labels: keys, datasets: [{ label: 'Număr studenți', data: values, backgroundColor: 'purple' }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Frecvența diferențelor (ra - ri)', font: { size: 20 } },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => {
              const diff = context.label;
              const count = context.raw as number;
              return [
                `Diferență: ${diff}`,
                `Număr studenți: ${count}`
              ];
            }
          }
        },
        datalabels: { display: false }
      },
      scales: { y: { beginAtZero: true } }
    }
  });
}
  }
}
