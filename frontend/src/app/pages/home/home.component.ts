import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DogService } from '../../services/dog.service';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import { Dog } from '../../models/dog.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  featuredDogs: Dog[] = [];
  isLoading = true;
  currentUserName: string | null = null;
  unreadCount = 0;
  mobileMenuOpen = false;
  private profileSubscription?: Subscription;

  getRescuerDisplayName(dog: Dog): string {

    if (!dog.rescuer) {
      console.warn('[HOME] No hay información del rescatista para:', dog.name);
      return 'Rescatista';
    }
    if (dog.rescuer.rescuer_type === 'organizacion' || dog.rescuer.rescuer_type === 'albergue') {

      return dog.rescuer.organization_name || 'Organización';
    }
    const fullName = `${dog.rescuer.first_name} ${dog.rescuer.last_name}`;

    return fullName;
  }

  constructor(
    private dogService: DogService,
    public authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {

      // Siempre suscribirse al perfil (esperar a que se cargue)
      this.profileSubscription = this.authService.currentProfile$.pipe(
        filter(profile => profile !== null)
      ).subscribe(profile => {

        if (profile && profile.first_name) {
          this.currentUserName = `${profile.first_name} ${profile.last_name}`;

        }
      });
      
      // Fallback: usar email si después de 1 segundo no hay nombre
      setTimeout(() => {
        const user = this.authService.getCurrentUser();
        if (!this.currentUserName && user && user.email) {
          this.currentUserName = user.email.split('@')[0];
        }
      }, 1000);
      
      const allDogs = await this.dogService.getAllDogs({ status: 'disponible' });

      this.featuredDogs = allDogs.slice(0, 6);
      
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

  ngOnDestroy() {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  navigateToSearch() {
    this.router.navigate(['/dogs']);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  async logout() {
    this.mobileMenuOpen = false;
    await this.authService.signOut();
    this.router.navigate(['/']);
  }
}
