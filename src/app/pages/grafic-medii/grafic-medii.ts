import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-grafic-medii',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grafic-medii.html',
  styleUrls: ['./grafic-medii.css']
})
export class GraficMedii {
  options: string[] = [];
  selectedOptions: string[] = [];
  groupedData: Map<string, Record<number, number>> = new Map(); // key: "liceu — specializare", value: { an: medie }
  chart: Chart | null = null;
  loading = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  sanitize(input: string): string {
    return (input || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  loadData(): void {
    this.loading = true;
    this.http.get<any[]>('https://ionutb.github.io/simulare-evaluare2025/candidates2024.json').subscribe({
      next: (data) => {
        this.groupedData.clear();

        const rankedDataPerYear: Record<number, any[]> = {};

        data.forEach(c => {
          const an = +c.an || 0;
          const liceu = this.sanitize(c.liceu_nume_complet || c.h || 'Necunoscut');
          const specializare = this.sanitize(c.specializare_raw || c.sp || 'Necunoscut');
          const madm = parseFloat(c.madm);
          if (isNaN(madm)) return;

          const key = `${liceu} — ${specializare}`;
          if (!rankedDataPerYear[an]) rankedDataPerYear[an] = [];
          rankedDataPerYear[an].push({ key, madm });
        });

        for (const an in rankedDataPerYear) {
          const year = +an;
          rankedDataPerYear[year].sort((a, b) => b.madm - a.madm); // descrescător
          rankedDataPerYear[year].forEach((entry, index) => {
            entry.rankingPos = index + 1;
          });
        }

        for (const an in rankedDataPerYear) {
          const year = +an;
          const candidates = rankedDataPerYear[year];
          const byKey: Record<string, any[]> = {};

          candidates.forEach(c => {
            if (!byKey[c.key]) byKey[c.key] = [];
            byKey[c.key].push(c);
          });

          for (const key in byKey) {
            const filtered = byKey[key];
            const minMadm = Math.min(...filtered.map(c => c.madm));
            const lastAdmis = filtered.filter(c => c.madm === minMadm);
            const maxRankingPos = Math.max(...lastAdmis.map(c => c.rankingPos));

            if (!this.groupedData.has(key)) this.groupedData.set(key, {});
            this.groupedData.get(key)![year] = maxRankingPos;
          }
        }

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
