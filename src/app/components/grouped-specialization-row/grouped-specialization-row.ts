import {Component, Input, ViewEncapsulation} from '@angular/core';
import {GroupedSpecialization} from '../../models/groupedSpecialization';

@Component({
  selector: '[app-grouped-specialization-row]',
  imports: [],
  templateUrl: './grouped-specialization-row.html',
  standalone: true,
  styleUrl: './grouped-specialization-row.css',
  encapsulation: ViewEncapsulation.None
})
export class GroupedSpecializationRow {
  @Input() item!: GroupedSpecialization;
}
