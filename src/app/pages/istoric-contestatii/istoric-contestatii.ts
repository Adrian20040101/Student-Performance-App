import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import {HttpClient} from '@angular/common/http';
import {CommonModule} from '@angular/common';
import {Contestatie} from '../../models/contestatie';
import {ContestatieService} from '../../services/contestatie';
import {RouterLink} from '@angular/router';

Chart.register(...registerables);

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
  standalone: true,
  styleUrls: ['./istoric-contestatii.css'],
  imports: [CommonModule, RouterLink],
})
export class IstoricContestatii implements OnInit {
  statisticsError: string | null = null;
  statistics: ContestationStatistics = {
    total: 0,
    crescute: 0,
    scazute: 0,
    neschimbat: 0,
    mediaDiferenta: '0',
  };
  constructor(private contestatieService: ContestatieService) {}
  ngOnInit(): void {
    this.contestatieService.fetchContestatii();

    this.contestatieService.contestatii$.subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.processData(data);
        }
      },
      error: (err) => {
        this.statisticsError = `Eroare la încărcarea contestatii.json: ${err.message}`;
      }
    });
  }

  processData(data: Contestatie[]): void {
    let contested = data.filter(e => e.ra !== null);

    contested.sort((a, b) => a.ri - b.ri);

    const labels = contested.map(e => e.name);
    const riValues = contested.map(e => e.ri);
    const raValues = contested.map(e => e.ra as number);
    const deviation = contested.map(e => (e.ra as number) - e.ri);

    const total = contested.length;
    const crescut = contested.filter(e => (e.ra as number) > e.ri).length;
    const scazut = contested.filter(e => (e.ra as number) < e.ri).length;
    const neschimbat = contested.filter(e => (e.ra as number) === e.ri).length;
    const mediaDiferenta = total > 0 ? (contested.reduce((acc, e) => acc + ((e.ra as number) - e.ri), 0) / total).toFixed(3) : '0';

    this.statistics.total = total;
    this.statistics.crescute = crescut;
    this.statistics.scazute = scazut;
    this.statistics.neschimbat = neschimbat;
    this.statistics.mediaDiferenta = mediaDiferenta;

    this.renderCharts(labels, riValues, raValues, deviation);
  }

  renderCharts(labels: string[], riValues: number[], raValues: number[], deviation: number[]): void {
    new Chart('chartNote', {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Nota inițială (ri)',
            data: riValues,
            borderColor: 'blue',
            fill: false,
            tension: 0.1,
          },
          {
            label: 'Nota după contestație (ra)',
            data: raValues,
            borderColor: 'green',
            fill: false,
            tension: 0.1,
          }
        ]
      },
      options: {
        responsive: true,
        elements: {
          point: {
            radius: 0
          }
        },
        plugins: {
          datalabels: {
            display: false
          },
          title: {
            display: true,
            text: 'Evoluția notelor la română (ri vs ra)',
            font: {
              size: 24
            }
          },
          legend: {
            labels: {
              font: {
                size: 16
              }
            }
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (context) => {
                const idx = context.dataIndex ?? 0;
                const ri = riValues[idx];
                const ra = raValues[idx];
                return [`Nota inițială: ${ri.toFixed(2)}`, `Nota după contestație: ${ra.toFixed(2)}`];
              }
            }
          }
        }
      }
    });

    new Chart('chartDeviatie', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Diferență (ra - ri)',
          data: deviation,
          backgroundColor: deviation.map(v => v >= 0 ? 'green' : 'red')
        }]
      },
      options: {
        responsive: true,
        plugins: {
          datalabels: {
            display: false
          },
          title: {
            display: true,
            text: 'Devierea față de nota inițială (ra - ri)',
            font: {
              size: 24
            }
          },
          legend: {
            labels: {
              font: {
                size: 16
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const idx = context.dataIndex ?? 0;
                const val = context.dataset.data[idx] as number;
                const ri = riValues[idx];
                const ra = raValues[idx];
                return [`Diferență: ${val.toFixed(2)}`, `Inițial: ${ri.toFixed(2)}`, `Contestată: ${ra.toFixed(2)}`];
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}
