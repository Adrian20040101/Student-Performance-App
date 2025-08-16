import { Injectable } from '@angular/core';
import { BacData } from './statistici.model';

export const judetMap: Record<string, string> = {
  AB: 'Alba',
  AR: 'Arad',
  AG: 'Arges',
  B: 'București',
  BC: 'Bacău',
  BH: 'Bihor',
  BN: 'Bistrița-Năsăud',
  BR: 'Brăila',
  BT: 'Botoșani',
  BV: 'Brașov',
  BZ: 'Buzău',
  CJ: 'Cluj',
  CL: 'Călărași',
  CS: 'Caraș-Severin',
  CT: 'Constanța',
  CV: 'Covasna',
  DB: 'Dâmbovița',
  DJ: 'Dolj',
  GJ: 'Gorj',
  GL: 'Galați',
  GR: 'Giurgiu',
  HD: 'Hunedoara',
  HR: 'Harghita',
  IF: 'Ilfov',
  IL: 'Ialomița',
  IS: 'Iași',
  MH: 'Mehedinți',
  MM: 'Maramureș',
  MS: 'Mureș',
  NT: 'Neamț',
  OT: 'Olt',
  PH: 'Prahova',
  SB: 'Sibiu',
  SJ: 'Sălaj',
  SM: 'Satu Mare',
  SV: 'Suceava',
  TL: 'Teleorman',
  TM: 'Timiș',
  TR: 'Tulcea',
  VL: 'Vâlcea',
  VN: 'Vrancea',
  VS: 'Vaslui',
};


@Injectable({ providedIn: 'root' })
export class StatisticiService {
  private readonly url = 'assets/bac_results_2024.json';

  private cleanCityName(city: string): string {
    if (!city) return 'Nespecificat';

    return city
      .trim()
      .replace(/^,/, '')
      .replace(/\s*,\s*/g, ' ')
      .replace(/\s*-\s*/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/\.$/, '');
  }

  async fetchParsedBacData(): Promise<BacData[]> {
    const response = await fetch(this.url);
    const raw = await response.json();

    const parsed = (raw as any[]).map(item => {
      const mediaNum = parseFloat(item.medie) || 0;

      const lastDoubleQuote = item.scoala.lastIndexOf('"');
      const lastSingleQuote = item.scoala.lastIndexOf("'");

      const schoolName = item.scoala;

      const cityMatch = schoolName.match(/['"]([^'"]+)['"]/);
      let city = cityMatch ? cityMatch[1] : 'Nespecificat';

      const lastQuoteIdx = Math.max(lastDoubleQuote, lastSingleQuote);
      if (lastQuoteIdx >= 0) {
        city = item.scoala.slice(lastQuoteIdx + 1).trim();
      }

      city = this.cleanCityName(city);

      if ((!city || city === 'Nespecificat') && item.judet === 'B') {
        city = 'București';
      }

      return {
        unitate: item.scoala,
        specializare: item.specializare,
        media: mediaNum,
        judet: item.judet,
        city
      };
    });

    return parsed;
  }
}
