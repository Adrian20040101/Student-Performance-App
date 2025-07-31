import {Injectable, OnInit} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Candidate} from '../models/candidate';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CandidateService implements OnInit{
  private candidatesSubject = new BehaviorSubject<Candidate[]| null>(null);
  candidates$ = this.candidatesSubject.asObservable();

  constructor(private http: HttpClient) {}

  fetchCandidates(): void {
    this.http.get<Candidate[]>('https://ionutb.github.io/simulare-evaluare2025/candidates2024.json')
      .subscribe({
        next: (data) => this.candidatesSubject.next(data),
        error: () => this.candidatesSubject.next([]), // fallback
      });
  }

  ngOnInit(): void {
    this.fetchCandidates();
  }
}
