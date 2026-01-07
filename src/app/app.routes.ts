import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'browse/:label/:address',
    loadComponent: () => import('./browse/browse.component').then(m => m.BrowseComponent)
  },
  {
    path: 'manage/:label/:address',
    loadComponent: () => import('./manage/manage.component').then(m => m.ManageComponent)
  },
  {
    path: 'kami/:id',
    loadComponent: () => import('./kami/kami.component').then(m => m.KamiComponent)
  },
  { path: '**', redirectTo: '' }
];
