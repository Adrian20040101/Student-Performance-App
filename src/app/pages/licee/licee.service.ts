import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HighSchoolOptionInterface, FilteredHighSchoolEntry } from './licee.model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HighSchoolService {
  private cache = new Map<number, (HighSchoolOptionInterface & { an: number })[]>();
  private allHighSchools: (HighSchoolOptionInterface & { an: number })[] = [];
  private readonly years = [2022, 2023, 2024];

  constructor(private http: HttpClient) {}

  async initializeData(): Promise<boolean> {
    try {
      const results = await Promise.all(this.years.map(year => this.loadYear(year)));
      this.allHighSchools = results.flat();
      return true;
    } catch (err) {
      console.error('Failed to load school data', err);
      return false;
    }
  }

  private async loadYear(year: number): Promise<(HighSchoolOptionInterface & { an: number })[]> {
    if (this.cache.has(year)) {
      return this.cache.get(year)!;
    }

    const url = `assets/candidates${year}.json`;
    try {
      const data = await firstValueFrom(this.http.get<HighSchoolOptionInterface[]>(url));
      const enriched = data.map(entry => ({ ...entry, an: year }));
      this.cache.set(year, enriched);
      return enriched;
    } catch {
      return [];
    }
  }

  filterEligibleHighSchools(year: number, userAverage: number): FilteredHighSchoolEntry[] {
    const yearData = this.allHighSchools.filter(
      hs => hs.an === year && !isNaN(parseFloat(hs.madm ?? ''))
    );

    // extract language from specialization if available
    function extractLanguageFromSp(sp: string): string {
      const langMatch = sp.match(/Limba\s+([a-zA-ZăâîșțĂÂÎȘȚ]+)/i);
      return langMatch ? langMatch[1].toLowerCase() : '';
    }

    // normalize language
    function normalizeLanguage(raw: string): string {
      const lang = raw.toLowerCase().trim();
      if (lang === '-' || lang === '') return 'română'; // fallback
      if (lang.includes('rom')) return 'română';
      if (lang.includes('magh')) return 'maghiară';
      if (lang.includes('germ')) return 'germană';
      if (lang.includes('fran')) return 'franceză';
      if (lang.includes('engl')) return 'engleză';
      return lang;
    }

    const sortedByAdmission = [...yearData].sort(
      (a, b) => parseFloat(b.madm!) - parseFloat(a.madm!)
    );

    const rankMap = new Map<string, number>();
    sortedByAdmission.forEach((entry, index) => {
      rankMap.set(entry.n, index + 1);
    });

    // filter only liceu or colegiul and where userAverage >= admission average
    const eligible = sortedByAdmission.filter(hs => {
      const schoolName = hs.s?.toLowerCase() ?? '';
      const isLiceu = schoolName.includes('liceu') || schoolName.includes('colegiul');
      return isLiceu && parseFloat(hs.madm!) <= userAverage;
    });

    // group by liceu + specializare + language
    const grouped = new Map<string, HighSchoolOptionInterface[]>();
    eligible.forEach(entry => {
      const langFromSp = extractLanguageFromSp(entry.sp);
      const langFinal = normalizeLanguage(langFromSp || entry.lm);
      const key = `${entry.s.trim()}|||${entry.sp.trim()}|||${langFinal}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entry);
    });

    // build final filtered array and exclude groups where first and last admission grades are equal
    const result: FilteredHighSchoolEntry[] = [];
    for (const [key, group] of grouped.entries()) {
      const sortedGroup = group.sort((a, b) => parseFloat(b.madm!) - parseFloat(a.madm!));
      const [liceu, specializare, limba] = key.split('|||');

      const prima = sortedGroup[0];
      const ultima = sortedGroup[sortedGroup.length - 1];

      // exclude groups where admission grades are the same
      if (prima.madm === ultima.madm) continue;

      result.push({
        liceu,
        specializare: specializare.replace(/<\/?b>/g, '').trim(),
        limba,
        primaMedie: prima.madm!,
        primaAbs: prima.mabs!,
        pozMin: rankMap.get(prima.n) ?? -1,
        ultimaMedie: ultima.madm!,
        ultimaAbs: ultima.mabs!,
        pozMax: rankMap.get(ultima.n) ?? -1,
      });
    }

    return result.sort((a, b) => parseFloat(b.ultimaMedie) - parseFloat(a.ultimaMedie));
  }
}
