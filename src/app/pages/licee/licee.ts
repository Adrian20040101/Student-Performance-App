import { Component, OnInit } from '@angular/core';
import { HighSchoolService } from './licee.service';
import { FilteredHighSchoolEntry } from './licee.model';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-licee',
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './licee.html',
  styleUrls: ['./licee.css']
})
export class Licee implements OnInit {
  userAverage: number | null = null;
  userGradAverage: number | null = null;
  selectedYear = 2024;
  hasSearched = false;
  dataLoaded = false;
  filteredHighSchools: FilteredHighSchoolEntry[] = [];
  readonly years = [2022, 2023, 2024];

  constructor(private highSchoolService: HighSchoolService) {}

  async ngOnInit(): Promise<void> {
    this.dataLoaded = await this.highSchoolService.initializeData();
  }

  onYearChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement | null;
    if (!selectElement) return;
    this.selectedYear = Number(selectElement.value);
  }

  async onSubmit(): Promise<void> {
    if (!this.dataLoaded || this.userAverage === null) return;
    this.filteredHighSchools = this.highSchoolService.filterEligibleHighSchools(
      this.selectedYear,
      this.userAverage
    );
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
