import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Licee } from './pages/licee/licee';
import { Statistici } from './pages/statistici/statistici';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'licee', component: Licee },
  { path: 'statistici', component: Statistici},
  { path: '**', redirectTo: '' }
];
