import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-favorite-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="toggleFavorite($event)"
      [disabled]="loading || !isAuthenticated"
      [class]="buttonClass"
      [title]="isAuthenticated ? (isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos') : 'Inicia sesión para agregar favoritos'"
    >
      <svg class="w-5 h-5" [class.fill-current]="isFavorite" [class.text-red-500]="isFavorite" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span *ngIf="showCount && favoriteCount > 0" class="ml-1 text-sm">{{ favoriteCount }}</span>
    </button>
  `,
  styles: [`
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class FavoriteButtonComponent {
  @Input() dogId!: string;
  @Input() showCount = false;
  @Input() buttonClass = 'p-2 rounded-full hover:bg-gray-100 transition-colors';
  @Output() favoriteToggled = new EventEmitter<boolean>();

  isFavorite = false;
  loading = false;
  favoriteCount = 0;
  isAuthenticated = false;

  constructor(
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.isAuthenticated = this.authService.isAuthenticated();
    
    if (this.isAuthenticated) {
      this.favoriteService.favorites$.subscribe(favorites => {
        this.isFavorite = favorites.has(this.dogId);
      });
    }
  }

  ngOnInit() {
    if (this.showCount) {
      this.loadFavoriteCount();
    }
  }

  async loadFavoriteCount() {
    try {
      this.favoriteCount = await this.favoriteService.getFavoriteCount(this.dogId);
    } catch (error) {
      console.error('Error loading favorite count:', error);
    }
  }

  async toggleFavorite(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.isAuthenticated) {
      this.toastr.warning('Inicia sesión para agregar favoritos');
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading = true;
    try {
      const newState = await this.favoriteService.toggleFavorite(user.id, this.dogId);
      this.isFavorite = newState;
      
      if (this.showCount) {
        this.favoriteCount += newState ? 1 : -1;
      }

      this.toastr.success(
        newState ? 'Agregado a favoritos' : 'Eliminado de favoritos'
      );
      
      this.favoriteToggled.emit(newState);
    } catch (error: any) {
      this.toastr.error(error.message || 'Error al actualizar favorito');
    } finally {
      this.loading = false;
    }
  }
}
