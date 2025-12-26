import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Dog } from '../../models/dog.model';
import { UrgencyBadgeComponent } from '../../components/urgency-badge/urgency-badge.component';
import { FavoriteButtonComponent } from '../../components/favorite-button/favorite-button.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, UrgencyBadgeComponent, FavoriteButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow-sm">
        <div class="container mx-auto px-4 py-4">
          <div class="flex justify-between items-center">
            <a routerLink="/" class="text-2xl font-bold text-indigo-600 flex items-center gap-2">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              AdoptaUnAmigo
            </a>
            <div class="flex gap-4 items-center">
              <a routerLink="/dogs" class="text-gray-700 hover:text-indigo-600 transition">
                Perros Disponibles
              </a>
              <a routerLink="/profile" class="text-gray-700 hover:text-indigo-600 transition">
                Mi Cuenta
              </a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Header -->
      <div class="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
        <div class="container mx-auto px-4 py-8">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
            <h1 class="text-4xl font-bold">Mis Favoritos</h1>
          </div>
          <p class="text-pink-100">Perros que has marcado como favoritos</p>
        </div>
      </div>

      <div class="container mx-auto px-4 py-8">
        <!-- Loading -->
        <div *ngIf="isLoading" class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && favoriteDogs.length === 0" class="text-center py-20">
          <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 class="text-2xl font-bold text-gray-700 mb-2">Aún no tienes favoritos</h2>
          <p class="text-gray-500 mb-6">Explora los perros disponibles y marca tus favoritos haciendo clic en el corazón</p>
          <a routerLink="/dogs" class="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Ver Perros Disponibles
          </a>
        </div>

        <!-- Favorites Grid -->
        <div *ngIf="!isLoading && favoriteDogs.length > 0">
          <div class="mb-6 flex items-center justify-between">
            <p class="text-gray-600">
              <svg class="w-5 h-5 inline mr-1 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
              </svg>
              Tienes {{ favoriteDogs.length }} {{ favoriteDogs.length === 1 ? 'perro favorito' : 'perros favoritos' }}
            </p>
            <button 
              *ngIf="favoriteDogs.length > 0"
              (click)="clearAllFavorites()"
              class="text-sm text-red-600 hover:text-red-700 hover:underline transition">
              Eliminar todos
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div *ngFor="let dog of favoriteDogs" 
                 class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer group"
                 [routerLink]="['/dogs', dog.id]">
              <div class="relative h-56 bg-gray-200 overflow-hidden">
                <img 
                  [src]="dog.main_image_url || dog.images?.[0] || 'https://via.placeholder.com/400x300?text=Sin+Foto'" 
                  [alt]="dog.name"
                  class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  (error)="$any($event.target).src='https://via.placeholder.com/400x300?text=Sin+Foto'"
                />
                <div class="absolute top-2 right-2">
                  <span class="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                    Disponible
                  </span>
                </div>
                <div class="absolute top-2 left-2">
                  <app-urgency-badge 
                    [urgencyLevel]="dog.urgency_level" 
                    [daysInShelter]="dog.days_in_shelter">
                  </app-urgency-badge>
                </div>
                <div class="absolute bottom-2 right-2">
                  <app-favorite-button 
                    [dogId]="dog.id" 
                    [showCount]="false"
                    (click)="$event.stopPropagation()">
                  </app-favorite-button>
                </div>
              </div>
              <div class="p-5">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition">{{ dog.name }}</h3>
                  <svg class="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p class="text-gray-600 text-sm mb-1">{{ dog.breed || 'Mestizo' }}</p>
                
                <div *ngIf="dog.age_years || dog.age_months" class="flex items-center gap-1 text-gray-500 text-sm mb-3">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span *ngIf="dog.age_years">{{ dog.age_years }} años </span>
                  <span *ngIf="dog.age_months">{{ dog.age_months }} meses</span>
                </div>

                <p class="text-gray-600 text-sm mb-4 line-clamp-2">{{ dog.description }}</p>

                <div class="flex flex-wrap gap-2 text-xs">
                  <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {{ dog.size }}
                  </span>
                  <span class="bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                    {{ dog.gender }}
                  </span>
                  <span *ngIf="dog.is_vaccinated" class="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Vacunado
                  </span>
                  <span *ngIf="dog.is_sterilized" class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    Esterilizado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favoriteDogs: Dog[] = [];
  isLoading = true;
  private favoritesSubscription?: Subscription;

  constructor(
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id;
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    // Cargar favoritos del usuario
    await this.favoriteService.loadUserFavorites(userId);

    // Obtener perros favoritos
    await this.loadFavorites(userId);

    // Suscribirse a cambios en favoritos
    this.favoritesSubscription = this.favoriteService.favorites$.subscribe(async () => {
      await this.loadFavorites(userId);
    });
  }

  ngOnDestroy() {
    if (this.favoritesSubscription) {
      this.favoritesSubscription.unsubscribe();
    }
  }

  async loadFavorites(userId: string) {
    try {
      this.favoriteDogs = await this.favoriteService.getFavorites(userId);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async clearAllFavorites() {
    if (!confirm('¿Estás seguro de que quieres eliminar todos tus favoritos?')) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id;
    if (!userId) return;

    try {
      // Eliminar todos los favoritos uno por uno
      for (const dog of this.favoriteDogs) {
        await this.favoriteService.toggleFavorite(userId, dog.id);
      }
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  }
}
