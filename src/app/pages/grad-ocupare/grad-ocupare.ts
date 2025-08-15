import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {GroupedSpecializationRow} from '../../components/grouped-specialization-row/grouped-specialization-row';
import {GroupedSpecialization} from '../../models/groupedSpecialization';
import {RouterLink} from '@angular/router';
import { Candidate } from './grad-ocupare.model';

@Component({
  selector: 'app-occupancy',
  templateUrl: './grad-ocupare.html',
  standalone: true,
  imports: [FormsModule, CommonModule, GroupedSpecializationRow, RouterLink],
  styleUrls: ['./grad-ocupare.css'],
})
export class GradOcupare {
  position: number = 300;
  complete: GroupedSpecialization[] = [];
  partial: GroupedSpecialization[] = [];
  unoccupied: GroupedSpecialization[] = [];
  loading = false;

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.loadData();
  }

  sanitizeHtml(input: string): string {
    if (!input) return '';
    return input
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s*\/\s*rom\s*$/i, '')
      .trim();
  }

  loadData(): void {
    this.loading = true;
    this.http.get<Candidate[]>('https://ionutb.github.io/simulare-evaluare2025/candidates2024.json').subscribe(data => {
      const sorted = [...data].sort((a, b) => parseFloat(b.madm) - parseFloat(a.madm));
      const groups = new Map<string, { poz: number; medie: number }[]>();

      sorted.forEach((c, idx) => {
        const key = `${c.h} / ${c.sp}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push({poz: idx + 1, medie: parseFloat(c.madm)});
      });

      this.complete = [];
      this.partial = [];
      this.unoccupied = [];

      for (const [liceu, pozitii] of groups) {
        const pozList = pozitii.map(p => p.poz);
        const prima = Math.min(...pozList);
        const ultima = Math.max(...pozList);
        const capacitate = pozitii.length;          // Poziții ocupate (total capacity)
        const ocupate = pozitii.filter(p => p.poz < this.position).length; // Locuri ocupate
        const libere = capacitate - ocupate;         // Locuri libere
        const procent = (ocupate / capacitate) * 100; // % Ocupare
        const ultimaMedie = pozitii.find(p => p.poz === ultima)?.medie.toFixed(2) ?? '-';

        // Sanitize the name to remove any HTML tags or bad formatting
        const sanitizedName = this.sanitizeHtml(liceu);

        const entry = {
          sanitizedName,               // Liceu + Specializare
          positionsOccupied: capacitate,  // Poziții ocupate (total capacity)
          placesOccupied: ocupate,        // Locuri ocupate
          placesFree: libere,             // Locuri libere
          percentage: parseFloat(procent.toFixed(2)), // % Ocupare
          lastAverage: ultimaMedie,       // Ultima medie
        };

        if (ocupate === capacitate) {
          this.complete.push(entry);
        } else if (ocupate > 0) {
          this.partial.push(entry);
        } else {
          this.unoccupied.push(entry);
        }
      }

      const sortFn = (a: any, b: any) => parseFloat(b.lastAverage) - parseFloat(a.lastAverage);

      this.complete.sort(sortFn);
      this.partial.sort(sortFn);
      this.unoccupied.sort(sortFn);

      this.loading = false;
    });
  }
}
