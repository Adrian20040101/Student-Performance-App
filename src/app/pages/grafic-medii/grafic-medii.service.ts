import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { GraficMediiData } from './grafic-medii.model';

@Injectable({ providedIn: 'root' })
export class GraficMediiService {
  private readonly url = 'https://ionutb.github.io/simulare-evaluare2025/candidates2024.json';

  constructor(private http: HttpClient) {}

  getGroupedData(): Observable<Map<string, GraficMediiData>> {
    return this.http.get<any[]>(this.url).pipe(
      map((data) => {
        const grouped = new Map<string, GraficMediiData>();
        const rankedDataPerYear: Record<number, any[]> = {};

        const sanitize = (input: string): string =>
          (input || '')
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<\/?[^>]+(>|$)/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        data.forEach(c => {
          const an = +c.an || 0;
          const liceu = sanitize(c.liceu_nume_complet || c.h || 'Necunoscut');
          const specializare = sanitize(c.specializare_raw || c.sp || 'Necunoscut');
          const madm = parseFloat(c.madm);
          if (isNaN(madm)) return;

          const key = `${liceu} — ${specializare}`;
          if (!rankedDataPerYear[an]) rankedDataPerYear[an] = [];
          rankedDataPerYear[an].push({ key, madm });
        });

        for (const an in rankedDataPerYear) {
          const year = +an;
          rankedDataPerYear[year].sort((a, b) => b.madm - a.madm);
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

            if (!grouped.has(key)) grouped.set(key, {});
            grouped.get(key)![year] = maxRankingPos;
          }
        }

        return grouped;
      })
    );
  }
}
