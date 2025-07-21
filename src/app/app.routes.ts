import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Licee } from './pages/licee/licee';
import { Statistici } from './pages/statistici/statistici';
import {GradOcupare} from './pages/grad-ocupare/grad-ocupare';
import {IstoricContestatii} from './pages/istoric-contestatii/istoric-contestatii';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'licee', component: Licee },
  { path: 'statistici', component: Statistici},
  { path: 'grad-ocupare', component: GradOcupare},
  { path: 'istoric-contestatii', component: IstoricContestatii},
  { path: '**', redirectTo: '' }
];
