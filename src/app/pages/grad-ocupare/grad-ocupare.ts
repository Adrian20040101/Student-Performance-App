import {Component, OnInit} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {GroupedSpecializationRow} from '../../components/grouped-specialization-row/grouped-specialization-row';
import {GroupedSpecialization} from '../../models/groupedSpecialization';
import {RouterLink} from '@angular/router';
import {Candidate} from '../../models/candidate';
import {CandidateService} from '../../services/candidate';
import {filter, take} from 'rxjs';

@Component({
  selector: 'app-occupancy',
  templateUrl: './grad-ocupare.html',
  standalone: true,
  imports: [FormsModule, CommonModule, GroupedSpecializationRow, RouterLink],
  styleUrls: ['./grad-ocupare.css'],
})
export class GradOcupare implements OnInit{
  position: number = 300;
  complete: GroupedSpecialization[] = [];
  partial: GroupedSpecialization[] = [];
  unoccupied: GroupedSpecialization[] = [];
  loading = false;

  constructor(private candidateService: CandidateService) {
  }

  ngOnInit(): void {
    this.loading = true;

    this.candidateService.fetchCandidates();  // Start fetch first

    this.candidateService.candidates$
      .pipe(filter((data): data is Candidate[] => data !== null)) // Filter out nulls
      .subscribe(data => {
        this.processData();
      });
  }

  sanitizeHtml(input: string): string {
    if (!input) return '';
    return input
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s*\/\s*rom\s*$/i, '')
      .trim();
  }

  processData(): void {
    this.candidateService.candidates$.pipe(take(1)).subscribe(data => {
      if (!data) {
        this.loading = false;
        return;
      }

      const sorted = [...data].sort((a, b) => parseFloat(b.madm) - parseFloat(a.madm));
      const groups = new Map<string, { poz: number; medie: number }[]>();

      sorted.forEach((c, idx) => {
        const key = `${c.h} / ${c.sp}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push({ poz: idx + 1, medie: parseFloat(c.madm) });
      });

      this.complete = [];
      this.partial = [];
      this.unoccupied = [];

      for (const [liceu, pozitii] of groups) {
        const pozList = pozitii.map(p => p.poz);
        const prima = Math.min(...pozList);
        const ultima = Math.max(...pozList);
        const capacitate = pozitii.length;
        const ocupate = pozitii.filter(p => p.poz < this.position).length;
        const libere = capacitate - ocupate;
        const procent = (ocupate / capacitate) * 100;
        const ultimaMedie = pozitii.find(p => p.poz === ultima)?.medie.toFixed(2) ?? '-';

        const sanitizedName = this.sanitizeHtml(liceu);

        const entry = {
          sanitizedName,
          positionsOccupied: capacitate,
          placesOccupied: ocupate,
          placesFree: libere,
          percentage: parseFloat(procent.toFixed(2)),
          lastAverage: ultimaMedie,
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
