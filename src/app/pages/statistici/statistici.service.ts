import { Injectable } from '@angular/core';
import { BacData } from './statistici.model';

@Injectable({ providedIn: 'root' })
export class StatisticiService {
  private readonly url = 'https://ionutb.github.io/simulare-evaluare2025/data.json';

  async fetchParsedBacData(): Promise<BacData[]> {
    const response = await fetch(this.url);
    const raw = await response.json();

    const headers = raw[0];
    const rows = raw.slice(1);

    const idxUnitate = headers.indexOf('Unitatea de învăţământ');
    const idxSpecializare = headers.indexOf('Specializare');
    const idxMedia = headers.indexOf('Media');
    const idxRezultat = headers.indexOf('Rezultatul final');

    const parsed = rows.map((row: any[]): BacData => {
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
    }).filter((r: { unitate: string; }) => r.unitate && r.unitate.endsWith('Brașov'));

    return parsed;
  }
}
