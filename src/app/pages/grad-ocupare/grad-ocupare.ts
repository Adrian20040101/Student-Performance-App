import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Candidate {
  h: string; // liceu
  sp: string; // specializare
  madm: string; // media admitere
}

interface GroupedSpecialization {
  name: string;
  firstRank: number;
  lastRank: number;
  occupied: number;
  free: number;
  percentage: number;
  lastAverage: string;
}

@Component({
  selector: 'app-occupancy',
  templateUrl: './grad-ocupare.html',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
  ],
  styleUrls: ['./grad-ocupare.css']
})
export class GradOcupare {
  position: number = 723;
  complete: GroupedSpecialization[] = [];
  partial: GroupedSpecialization[] = [];
  unoccupied: GroupedSpecialization[] = [];
  loading = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.http.get<Candidate[]>('https://ionutb.github.io/simulare-evaluare2025/candidates2024.json').subscribe(data => {
      const sorted = [...data].sort((a, b) => parseFloat(b.madm) - parseFloat(a.madm));
      const groups = new Map<string, { poz: number, medie: number }[]>();

      sorted.forEach((c, idx) => {
        const key = `${c.h} / ${c.sp}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push({ poz: idx + 1, medie: parseFloat(c.madm) });
      });

      this.complete = [];
      this.partial = [];
      this.unoccupied = [];
      console.log("start")
      for (const [liceu, pozitii] of groups) {
        const pozList = pozitii.map(p => p.poz);
        const prima = Math.min(...pozList);
        const ultima = Math.max(...pozList);
        const capacitate = pozitii.length;
        const ocupate = pozitii.filter(p => p.poz < this.position).length;
        const libere = capacitate - ocupate;
        const procent = (ocupate / capacitate) * 100;
        const ultimaMedie = pozitii.find(p => p.poz === ultima)?.medie.toFixed(2) ?? '-';

        const entry: GroupedSpecialization = {
          name: liceu,
          firstRank: prima,
          lastRank: ultima,
          occupied: ocupate,
          free: libere,
          percentage: parseFloat(procent.toFixed(2)),
          lastAverage: ultimaMedie
        };

        if (ocupate === capacitate) {
          this.complete.push(entry);
        } else if (ocupate > 0) {
          this.partial.push(entry);
        } else {
          this.unoccupied.push(entry);
        }
      }
      console.log("final")
      const sortFn = (a: GroupedSpecialization, b: GroupedSpecialization) => parseFloat(b.lastAverage) - parseFloat(a.lastAverage);
      this.complete.sort(sortFn);
      this.partial.sort(sortFn);
      this.unoccupied.sort(sortFn);
      this.loading = false;
    });
  }
}
