import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

interface HighSchoolOption {
  ja: string;
  jp: string;
  s: string;
  sc: string;
  sp: string;
  lm: string;
  n: string;
  mabs: string;
  madm: string;
  mev: string;
  nmate: string;
  nro: string;
  nlm: string;
  an?: number;
}

interface FilteredHighSchoolEntry {
  liceu: string;
  specializare: string;
  limba: string;
  primaMedie: string;
  primaAbs: string;
  pozMin: number;
  idMin: string;
  ultimaMedie: string;
  ultimaAbs: string;
  pozMax: number;
  idMax: string;
}

@Component({
  standalone: true,
  selector: 'app-licee',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './licee.html',
  styleUrl: './licee.css'
})
export class Licee implements OnInit {
  userAverage: number | null = null;
  userGradAverage: number | null = null;
  selectedYear: number = 2024;
  hasSearched = false;
  dataLoaded = false;

  allHighSchools: (HighSchoolOption & { an: number })[] = [];
  filteredHighSchools: FilteredHighSchoolEntry[] = [];
  years: number[] = [2022, 2023, 2024];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
  const urls = this.years.map(
    year => ({ year, url: `https://ionutb.github.io/simulare-evaluare2025/candidates${year}.json` })
  );

  Promise.all(
    urls.map(({ year, url }) =>
      this.http.get<HighSchoolOption[]>(url).toPromise().then(data => {
        if (!data) return [];
        console.log(`Year ${year} – First 5 entries:`, data.slice(0, 5));
        return data.map(entry => ({ ...entry, an: year }));
      })
    )
  )
  .then(results => {
    this.allHighSchools = results.flat().filter((item): item is HighSchoolOption & { an: number } => !!item);
    this.dataLoaded = true;
    console.log(`Loaded total: ${this.allHighSchools.length} high school entries.`);
  })
  .catch(error => {
    console.error('Error loading high school data:', error);
  });
}


  onSubmit(): void {
    if (!this.dataLoaded || this.userAverage === null) return;

    const yearData = this.allHighSchools
      .filter(hs => hs.an === this.selectedYear && !isNaN(parseFloat(hs.mev)));

    const sortedGlobal = [...yearData].sort((a, b) => parseFloat(b.mev) - parseFloat(a.mev));
    const globalRankMap = new Map<string, number>();
    sortedGlobal.forEach((entry, index) => {
      globalRankMap.set(entry.n, index + 1);
    });

    const eligible = yearData.filter(hs => {
      const isLiceu = hs.s?.toLowerCase().includes('liceu') || hs.s?.toLowerCase().includes('colegiul');
      return isLiceu && parseFloat(hs.mev) <= this.userAverage!;
    });

    const groupedMap = new Map<string, HighSchoolOption[]>();
    eligible.forEach(entry => {
      const key = `${entry.s.trim()}::${entry.sp.trim()}`;
      const group = groupedMap.get(key) || [];
      group.push(entry);
      groupedMap.set(key, group);
    });

    this.filteredHighSchools = Array.from(groupedMap.entries())
      .map(([key, entries]) => {
        const [liceu, specializare] = key.split('::');
        const sorted = entries.sort((a, b) => parseFloat(b.mev) - parseFloat(a.mev));
        const prima = sorted[0];
        const ultima = sorted[sorted.length - 1];

        return {
          liceu,
          specializare,
          limba: prima.lm && prima.lm !== '-' ? prima.lm : 'Nespecificat',
          primaMedie: prima.mev,
          primaAbs: prima.mabs,
          pozMin: globalRankMap.get(prima.n) ?? 0,
          idMin: prima.n,
          ultimaMedie: ultima.mev,
          ultimaAbs: ultima.mabs,
          pozMax: globalRankMap.get(ultima.n) ?? 0,
          idMax: ultima.n,
        };
      })
      .filter(entry => entry.primaMedie !== entry.ultimaMedie)
      .sort((a, b) => parseFloat(b.ultimaMedie) - parseFloat(a.ultimaMedie));

    this.hasSearched = true;
  }

  sanitizeHtml(input: string): string {
    if (!input) return '';
    return input
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s*\/\s*rom\s*$/i, '')
      .trim();
  }
}
