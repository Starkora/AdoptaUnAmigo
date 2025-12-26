import { Routes } from '@angular/router';
import { authGuard, rescuerGuard, adopterGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dogs',
    loadComponent: () => import('./pages/dogs/dog-list/dog-list.component').then(m => m.DogListComponent)
  },
  {
    path: 'dogs/:id',
    loadComponent: () => import('./pages/dogs/dog-detail/dog-detail.component').then(m => m.DogDetailComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/chat/chat.component').then(m => m.ChatComponent)
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/favorites/favorites.component').then(m => m.FavoritesComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    children: [
      {
        path: 'adoptante',
        canActivate: [adopterGuard],
        loadComponent: () => import('./pages/dashboard/adopter-dashboard/adopter-dashboard.component').then(m => m.AdopterDashboardComponent)
      },
      {
        path: 'rescatista',
        canActivate: [rescuerGuard],
        loadComponent: () => import('./pages/dashboard/rescuer-dashboard/rescuer-dashboard.component').then(m => m.RescuerDashboardComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
