import {Component} from '@angular/core';
import {RouterModule} from '@angular/router';
import {Home} from './pages/home/home';
import {Statistici} from './pages/statistici/statistici';
import {Licee} from './pages/licee/licee';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}

