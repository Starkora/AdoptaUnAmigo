import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DogService } from '../../../services/dog.service';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';
import { FavoriteService } from '../../../services/favorite.service';
import { Dog, DogSize, DogGender } from '../../../models/dog.model';
import { FavoriteButtonComponent } from '../../../components/favorite-button/favorite-button.component';
import { UrgencyBadgeComponent } from '../../../components/urgency-badge/urgency-badge.component';

@Component({
  selector: 'app-dog-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FavoriteButtonComponent, UrgencyBadgeComponent],
  templateUrl: './dog-list.component.html'
})
export class DogListComponent implements OnInit, OnDestroy {
  dogs: Dog[] = [];
  filteredDogs: Dog[] = [];
  isLoading = true;
  currentUserName: string | null = null;
  unreadCount = 0;
  private profileSubscription?: Subscription;

  getRescuerDisplayName(dog: Dog): string {

    if (!dog.rescuer) {
      console.warn('[DOG-LIST] No hay información del rescatista para:', dog.name);
      return 'Rescatista';
    }
    if (dog.rescuer.rescuer_type === 'organizacion' || dog.rescuer.rescuer_type === 'albergue') {

      return dog.rescuer.organization_name || 'Organización';
    }
    const fullName = `${dog.rescuer.first_name} ${dog.rescuer.last_name}`;

    return fullName;
  }

  selectedSize: DogSize | '' = '';
  selectedGender: DogGender | '' = '';
  searchTerm = '';
  selectedEnergyLevel: string = '';
  selectedGoodWithKids: string = '';
  selectedGoodWithDogs: string = '';
  selectedGoodWithCats: string = '';
  selectedExperience: string = '';
  showAdvancedFilters = false;

  constructor(
    private dogService: DogService,
    public authService: AuthService,
    public favoriteService: FavoriteService,    private messageService: MessageService,    private router: Router
  ) {}

  async ngOnInit() {
    // Suscribirse al perfil para obtener el nombre del usuario
    this.profileSubscription = this.authService.currentProfile$.pipe(
      filter(profile => profile !== null)
    ).subscribe(profile => {
      if (profile && profile.first_name) {
        this.currentUserName = `${profile.first_name} ${profile.last_name}`;
      }
    });

    await this.loadDogs();
    
    // Cargar favoritos del usuario si está autenticado
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.id) {
      await this.favoriteService.loadUserFavorites(currentUser.id);
    }
  }

  ngOnDestroy() {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/']);
  }

  async loadDogs() {
    try {
      this.dogs = await this.dogService.getAllDogs({ status: 'disponible' });

      this.applyFilters();
      
      // Cargar contador de mensajes no leídos
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.unreadCount = await this.messageService.getUnreadCount(currentUser.id);
      }
    } catch (error) {
      console.error('Error loading dogs:', error);
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {
    this.filteredDogs = this.dogs.filter(dog => {
      const matchesSize = !this.selectedSize || dog.size === this.selectedSize;
      const matchesGender = !this.selectedGender || dog.gender === this.selectedGender;
      const matchesSearch = !this.searchTerm || 
        dog.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dog.breed?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesEnergyLevel = !this.selectedEnergyLevel || dog.energy_level === this.selectedEnergyLevel;
      const matchesExperience = !this.selectedExperience || dog.experience_required === this.selectedExperience;
      
      const matchesKids = !this.selectedGoodWithKids || 
        (this.selectedGoodWithKids === 'true' && dog.good_with_kids === true) ||
        (this.selectedGoodWithKids === 'false' && dog.good_with_kids === false) ||
        (this.selectedGoodWithKids === 'unknown' && dog.good_with_kids === null);
      
      const matchesDogs = !this.selectedGoodWithDogs || 
        (this.selectedGoodWithDogs === 'true' && dog.good_with_dogs === true) ||
        (this.selectedGoodWithDogs === 'false' && dog.good_with_dogs === false) ||
        (this.selectedGoodWithDogs === 'unknown' && dog.good_with_dogs === null);
      
      const matchesCats = !this.selectedGoodWithCats || 
        (this.selectedGoodWithCats === 'true' && dog.good_with_cats === true) ||
        (this.selectedGoodWithCats === 'false' && dog.good_with_cats === false) ||
        (this.selectedGoodWithCats === 'unknown' && dog.good_with_cats === null);
      
      return matchesSize && matchesGender && matchesSearch && 
             matchesEnergyLevel && matchesExperience &&
             matchesKids && matchesDogs && matchesCats;
    });
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.selectedSize = '';
    this.selectedGender = '';
    this.searchTerm = '';
    this.selectedEnergyLevel = '';
    this.selectedGoodWithKids = '';
    this.selectedGoodWithDogs = '';
    this.selectedGoodWithCats = '';
    this.selectedExperience = '';
    this.applyFilters();
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }
}
