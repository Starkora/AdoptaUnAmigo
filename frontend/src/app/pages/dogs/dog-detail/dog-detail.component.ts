import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DogService } from '../../../services/dog.service';
import { AdoptionService } from '../../../services/adoption.service';
import { MessageService } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';
import { Dog } from '../../../models/dog.model';
import { UserProfile } from '../../../models/user.model';
import { PhotoGalleryComponent } from '../../../components/photo-gallery/photo-gallery.component';
import { SafePipe } from '../../../pipes/safe.pipe';

@Component({
  selector: 'app-dog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, PhotoGalleryComponent, SafePipe],
  templateUrl: './dog-detail.component.html'
})
export class DogDetailComponent implements OnInit, OnDestroy {
  dog: Dog | null = null;
  loading = true;
  error = '';
  currentUser: UserProfile | null = null;
  currentUserName: string | null = null;
  unreadCount = 0;
  private profileSubscription?: Subscription;
  selectedImageIndex = 0;
  isSubmittingAdoption = false;
  adoptionSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dogService: DogService,
    private adoptionService: AdoptionService,
    private messageService: MessageService,
    public authService: AuthService
  ) {}

  async ngOnInit() {
    // Suscribirse al perfil para obtener el nombre del usuario y el perfil completo
    this.profileSubscription = this.authService.currentProfile$.pipe(
      filter(profile => profile !== null)
    ).subscribe(profile => {
      if (profile) {
        this.currentUserName = `${profile.first_name} ${profile.last_name}`;
        this.currentUser = profile;
      }
    });

    // Obtener el perfil actual inmediatamente si ya está disponible
    const profile = this.authService.getCurrentProfile();
    if (profile) {
      this.currentUser = profile;
    }

    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      await this.loadDog(id);
    } else {
      this.error = 'ID de perro no válido';
      this.loading = false;
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

  async loadDog(id: string) {
    try {
      this.loading = true;
      this.dog = await this.dogService.getDogById(id);
      
      // Cargar contador de mensajes no leídos
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.unreadCount = await this.messageService.getUnreadCount(currentUser.id);
      }
      
      this.error = '';
    } catch (err: any) {
      this.error = err.message || 'Error al cargar los detalles del perro';
    } finally {
      this.loading = false;
    }
  }

  selectImage(index: number) {
    this.selectedImageIndex = index;
  }

  async submitAdoptionRequest() {
    if (!this.dog || !this.currentUser) return;

    try {
      this.isSubmittingAdoption = true;
      
      // Verificar cooldown period
      const cooldownCheck = await this.adoptionService.checkCooldownPeriod(
        this.dog.id,
        this.currentUser.id
      );

      if (cooldownCheck.isInCooldown) {
        this.error = `Has cancelado recientemente tu solicitud para esta mascota. Podrás solicitar nuevamente en ${cooldownCheck.daysRemaining} día(s).`;
        this.isSubmittingAdoption = false;
        return;
      }
      
      // Verificar si ya existe una solicitud
      const existingRequest = await this.adoptionService.checkExistingRequest(
        this.dog.id,
        this.currentUser.id
      );

      if (existingRequest) {
        const statusMessages: { [key: string]: string } = {
          'pendiente': 'Ya tienes una solicitud pendiente para esta mascota. El rescatista la está revisando.',
          'aprobada': 'Tu solicitud para esta mascota ya fue aprobada.',
          'rechazada': 'Tu solicitud anterior para esta mascota fue rechazada.',
          'completada': 'Ya completaste la adopción de esta mascota.',
          'cancelada_por_adoptante': 'Cancelaste tu solicitud anterior. Espera el período de cooldown.'
        };
        
        this.error = statusMessages[existingRequest.status] || 'Ya enviaste una solicitud para esta mascota.';
        this.isSubmittingAdoption = false;
        return;
      }

      // Si no existe solicitud previa, crear una nueva
      await this.adoptionService.createAdoptionRequest({
        dog_id: this.dog.id,
        message: '',
        has_experience: false,
        has_other_pets: false,
        has_yard: false,
        reason_for_adoption: ''
      }, this.currentUser.id);
      
      this.adoptionSuccess = true;
      setTimeout(() => {
        this.router.navigate(['/adopter']);
      }, 2000);
    } catch (err: any) {
      this.error = err.message || 'Error al enviar solicitud de adopción';
      this.isSubmittingAdoption = false;
    }
  }

  get canAdopt(): boolean {
    return this.currentUser?.role === 'adoptante' && this.dog?.status === 'disponible';
  }

  get isOwnDog(): boolean {
    return this.currentUser?.id === this.dog?.rescuer_id;
  }

  calculateAge(): string {
    const years = this.dog?.age_years || 0;
    const months = this.dog?.age_months || 0;
    
    if (years === 0 && months === 0) return 'Edad desconocida';
    
    if (years === 0) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else if (months === 0) {
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    } else {
      return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
  }

  getSizeLabel(size: string): string {
    const labels: { [key: string]: string } = {
      pequeño: 'Pequeño',
      mediano: 'Mediano',
      grande: 'Grande'
    };
    return labels[size] || size;
  }

  getGenderLabel(gender: string): string {
    return gender === 'macho' ? 'Macho' : 'Hembra';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      disponible: 'Disponible',
      en_proceso: 'En Proceso',
      adoptado: 'Adoptado'
    };
    return labels[status] || status;
  }

  async contactRescuer() {
    if (!this.dog || !this.currentUser || !this.dog.rescuer_id) return;

    try {
      // Enviar mensaje inicial al rescatista
      await this.messageService.sendMessage(
        this.dog.rescuer_id,
        `Hola! Estoy interesado en adoptar a ${this.dog.name}. ¿Podríamos hablar sobre el proceso de adopción?`,
        this.dog.id
      );

      // Redirigir al chat
      this.router.navigate(['/chat']);
    } catch (err: any) {
      console.error('Error al contactar rescatista:', err);
      this.error = 'Error al enviar mensaje. Por favor intenta de nuevo.';
    }
  }
}
