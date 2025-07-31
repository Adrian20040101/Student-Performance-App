import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Contestatie } from '../models/contestatie';  // adjust the path

@Injectable({
  providedIn: 'root'
})
export class ContestatieService {
  private contestatiiSubject = new BehaviorSubject<Contestatie[] | null>(null);
  contestatii$ = this.contestatiiSubject.asObservable();

  constructor(private http: HttpClient) {}

  fetchContestatii(): void {
    this.http.get<Contestatie[]>('https://ionutb.github.io/simulare-evaluare2025/note.json').subscribe({
      next: (data) => this.contestatiiSubject.next(data),
      error: () => this.contestatiiSubject.next([]), // handle errors gracefully
    });
  }
}
