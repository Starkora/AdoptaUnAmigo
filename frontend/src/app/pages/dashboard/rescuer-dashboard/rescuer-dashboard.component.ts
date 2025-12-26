import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DogService } from '../../../services/dog.service';
import { AdoptionService } from '../../../services/adoption.service';
import { MessageService } from '../../../services/message.service';
import { UploadService } from '../../../services/upload.service';
import { AuthService } from '../../../services/auth.service';
import { Dog, CreateDogDto } from '../../../models/dog.model';
import { AdoptionRequest } from '../../../models/adoption.model';
import { UserProfile } from '../../../models/user.model';

@Component({
  selector: 'app-rescuer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './rescuer-dashboard.component.html'
})
export class RescuerDashboardComponent implements OnInit, OnDestroy {
  myDogs: Dog[] = [];
  adoptionRequests: AdoptionRequest[] = [];
  loading = true;
  error = '';
  currentUserName: string | null = null;
  unreadCount = 0;
  private profileSubscription?: Subscription;
  
  // Stats
  stats = {
    totalDogs: 0,
    availableDogs: 0,
    pendingRequests: 0,
    adoptedDogs: 0
  };

  // Form state
  showDogForm = false;
  isEditMode = false;
  editingDogId: string | null = null;
  uploadingImages = false;
  savingDog = false;

  // Modal de información del adoptante
  showAdopterInfoModal = false;
  selectedAdopter: UserProfile | null = null;
  selectedRequestId: string | null = null;

  // Modal de rechazo
  showRejectModal = false;
  rejectReason = '';
  rejectingRequest = false;

  dogForm: CreateDogDto = {
    name: '',
    breed: '',
    age_years: 0,
    age_months: 0,
    size: 'mediano',
    gender: 'macho',
    description: '',
    images: [],
    location: '',
    is_vaccinated: false,
    is_sterilized: false,
    medical_history: '',
    energy_level: 'medio',
    good_with_kids: null,
    good_with_dogs: null,
    good_with_cats: null,
    special_needs: '',
    experience_required: 'ninguna',
    urgency_level: 'normal',
    video_url: ''
  };

  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  constructor(
    private dogService: DogService,
    private adoptionService: AdoptionService,
    private messageService: MessageService,
    private uploadService: UploadService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {

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
    
    await this.loadData();
  }

  ngOnDestroy() {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  async loadData() {
    try {
      this.loading = true;
      const currentUser = this.authService.getCurrentUser();
      
      if (!currentUser) {
        this.error = 'Usuario no autenticado';
        return;
      }

      // Load my dogs
      this.myDogs = await this.dogService.getMyDogs(currentUser.id);

      // Load adoption requests for my dogs
      this.adoptionRequests = await this.adoptionService.getAdoptionRequestsForMyDogs(currentUser.id);


      if (this.adoptionRequests[0]) {

      }

      // Calculate stats
      this.calculateStats();
      
      // Load unread messages count
      this.unreadCount = await this.messageService.getUnreadCount(currentUser.id);
      
      this.error = '';
    } catch (err: any) {
      this.error = err.message || 'Error al cargar los datos';
    } finally {
      this.loading = false;
    }
  }

  calculateStats() {
    this.stats.totalDogs = this.myDogs.length;
    this.stats.availableDogs = this.myDogs.filter(d => d.status === 'disponible').length;
    this.stats.pendingRequests = this.adoptionRequests.filter(r => r.status === 'pendiente').length;
    this.stats.adoptedDogs = this.myDogs.filter(d => d.status === 'adoptado').length;
  }

  async loadUnreadCount() {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.unreadCount = await this.messageService.getUnreadCount(currentUser.id);
      }
    } catch (err) {
      console.error('Error cargando mensajes no leídos:', err);
    }
  }

  openDogForm(dog?: Dog) {
    if (dog) {
      this.isEditMode = true;
      this.editingDogId = dog.id;
      this.dogForm = {
        name: dog.name,
        breed: dog.breed,
        age_years: dog.age_years,
        age_months: dog.age_months,
        size: dog.size,
        gender: dog.gender,
        description: dog.description,
        images: dog.images || [],
        location: dog.location,
        is_vaccinated: dog.is_vaccinated,
        is_sterilized: dog.is_sterilized,
        medical_history: dog.medical_history || '',
        energy_level: dog.energy_level || 'medio',
        good_with_kids: dog.good_with_kids,
        good_with_dogs: dog.good_with_dogs,
        good_with_cats: dog.good_with_cats,
        special_needs: dog.special_needs || '',
        experience_required: dog.experience_required || 'ninguna',
        urgency_level: dog.urgency_level || 'normal',
        video_url: dog.video_url || ''
      };
      this.previewUrls = dog.images || [];
    } else {
      this.isEditMode = false;
      this.editingDogId = null;
      this.resetForm();
    }
    this.showDogForm = true;
  }

  closeDogForm() {
    this.showDogForm = false;
    this.resetForm();
  }

  resetForm() {
    this.dogForm = {
      name: '',
      breed: '',
      age_years: 0,
      age_months: 0,
      size: 'mediano',
      gender: 'macho',
      description: '',
      images: [],
      location: '',
      is_vaccinated: false,
      is_sterilized: false,
      medical_history: '',
      energy_level: 'medio',
      good_with_kids: null,
      good_with_dogs: null,
      good_with_cats: null,
      special_needs: '',
      experience_required: 'ninguna',
      urgency_level: 'normal',
      video_url: ''
    };
    this.selectedFiles = [];
    this.previewUrls = [];
  }

  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles = files;
    
    // Create preview URLs
    this.previewUrls = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrls.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.previewUrls.splice(index, 1);
    if (this.selectedFiles.length > index) {
      this.selectedFiles.splice(index, 1);
    } else {
      this.dogForm.images?.splice(index - this.selectedFiles.length, 1);
    }
  }

  async saveDog() {
    try {
      this.savingDog = true;
      this.error = '';

      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.error = 'Usuario no autenticado';
        return;
      }

      // Upload new images if any
      if (this.selectedFiles.length > 0) {
        this.uploadingImages = true;
        const uploadedUrls = await this.uploadService.uploadMultipleImages(this.selectedFiles);
        this.dogForm.images = [...(this.dogForm.images || []), ...uploadedUrls];
        this.uploadingImages = false;
      }

      if (this.isEditMode && this.editingDogId) {
        await this.dogService.updateDog(this.editingDogId, this.dogForm);
      } else {
        await this.dogService.createDog(this.dogForm, currentUser.id);
      }

      await this.loadData();
      this.closeDogForm();
    } catch (err: any) {
      this.error = err.message || 'Error al guardar el perro';
      this.uploadingImages = false;
    } finally {
      this.savingDog = false;
    }
  }

  async updateRequestStatus(requestId: string, status: 'aprobada' | 'rechazada', reason?: string) {
    try {
      await this.adoptionService.updateAdoptionStatus(requestId, status, reason);
      
      // If approved, update dog status
      const request = this.adoptionRequests.find(r => r.id === requestId);
      if (request && status === 'aprobada') {
        await this.dogService.updateDog(request.dog_id, { status: 'adoptado' });
      }
      
      await this.loadData();
    } catch (err: any) {
      this.error = err.message || 'Error al actualizar la solicitud';
    }
  }

  async deleteDog(dogId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este perro?')) return;
    
    try {
      await this.dogService.updateDog(dogId, { status: 'adoptado' });
      await this.loadData();
    } catch (err: any) {
      this.error = err.message || 'Error al eliminar el perro';
    }
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pendiente: 'Pendiente',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada',
      completada: 'Completada'
    };
    return labels[status] || status;
  }

  getDogStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      disponible: 'Disponible',
      en_proceso: 'En Proceso',
      adoptado: 'Adoptado'
    };
    return labels[status] || status;
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/']);
  }

  // Métodos para el modal de información del adoptante
  viewAdopterInfo(request: AdoptionRequest) {


    this.selectedAdopter = request.adopter || null;
    this.selectedRequestId = request.id;
    this.showAdopterInfoModal = true;

  }

  closeAdopterInfoModal() {
    this.showAdopterInfoModal = false;
    this.selectedAdopter = null;
    this.selectedRequestId = null;
  }

  async approveFromModal() {
    if (this.selectedRequestId) {
      await this.updateRequestStatus(this.selectedRequestId, 'aprobada');
      this.closeAdopterInfoModal();
    }
  }

  async rejectFromModal() {


    this.showAdopterInfoModal = false;
    this.showRejectModal = true;

  }

  openRejectModal() {
    this.showRejectModal = true;
    this.rejectReason = '';
  }

  openRejectModalForRequest(requestId: string) {
    this.selectedRequestId = requestId;
    this.showRejectModal = true;
    this.rejectReason = '';
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.rejectReason = '';
  }

  async confirmReject() {
    if (!this.rejectReason.trim()) {
      alert('Por favor, ingresa un motivo para el rechazo');
      return;
    }

    if (this.selectedRequestId) {
      this.rejectingRequest = true;
      try {
        await this.updateRequestStatus(this.selectedRequestId, 'rechazada', this.rejectReason);
        this.closeRejectModal();
        this.selectedAdopter = null;
        this.selectedRequestId = null;
      } catch (error) {
        console.error('Error rechazando solicitud:', error);
        alert('Error al rechazar la solicitud');
      } finally {
        this.rejectingRequest = false;
      }
    }
  }

  // Funciones para enmascarar datos sensibles
  maskPhone(phone: string | undefined): string {
    if (!phone) return 'No especificado';
    // Mostrar solo los últimos 3 dígitos: 953222207 -> ******207
    return '*'.repeat(phone.length - 3) + phone.slice(-3);
  }

  maskEmail(email: string | undefined): string {
    if (!email) return 'No especificado';
    // Mostrar solo primeras 2 letras y dominio: estekora10@gmail.com -> es*******@gmail.com
    const [user, domain] = email.split('@');
    if (!domain) return email;
    const maskedUser = user.substring(0, 2) + '*'.repeat(user.length - 2);
    return `${maskedUser}@${domain}`;
  }

  maskDNI(dni: string | undefined): string {
    if (!dni) return 'No especificado';
    // Mostrar solo los últimos 3 dígitos: 74057907 -> *****907
    return '*'.repeat(dni.length - 3) + dni.slice(-3);
  }

  maskAddress(address: string | undefined): string {
    if (!address) return 'No especificado';
    // Mostrar solo las primeras 10 caracteres
    if (address.length <= 10) return address;
    return address.substring(0, 10) + '...';
  }

  async sendMessageToAdopter(request: AdoptionRequest) {
    if (!request.adopter_id || !request.dog_id) return;

    try {
      const dogName = request.dog?.name || 'el perro';
      // Enviar mensaje inicial al adoptante
      await this.messageService.sendMessage(
        request.adopter_id,
        `¡Hola! Tu solicitud de adopción para ${dogName} ha sido aprobada. ¿Cuándo podríamos coordinar una visita?`,
        request.dog_id
      );

      // Redirigir al chat
      this.router.navigate(['/chat']);
    } catch (err: any) {
      console.error('Error al enviar mensaje:', err);
      this.error = 'Error al enviar mensaje. Por favor intenta de nuevo.';
    }
  }
}
