import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AdoptionService } from '../../../services/adoption.service';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';
import { AdoptionRequest } from '../../../models/adoption.model';

@Component({
  selector: 'app-adopter-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './adopter-dashboard.component.html'
})
export class AdopterDashboardComponent implements OnInit, OnDestroy {
  adoptionRequests: AdoptionRequest[] = [];
  loading = true;
  error = '';
  currentUserName: string | null = null;
  unreadCount = 0;
  private profileSubscription?: Subscription;
  
  // Modal state
  showCancelModal = false;
  requestToCancel: AdoptionRequest | null = null;
  cancellationReason = '';
  cancellingRequest = false;
  
  // Stats
  stats = {
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  };

  constructor(
    private adoptionService: AdoptionService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
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

    await this.loadAdoptionRequests();
    await this.loadUnreadCount();
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

  async loadAdoptionRequests() {
    try {
      this.loading = true;
      const currentUser = this.authService.getCurrentUser();
      
      if (!currentUser) {
        this.error = 'Usuario no autenticado';
        return;
      }

      // Load all my adoption requests
      this.adoptionRequests = await this.adoptionService.getMyAdoptionRequests(currentUser.id);
      
      // Calculate stats
      this.calculateStats();
      
      this.error = '';
    } catch (err: any) {
      this.error = err.message || 'Error al cargar las solicitudes de adopción';
    } finally {
      this.loading = false;
    }
  }

  calculateStats() {
    this.stats.totalRequests = this.adoptionRequests.length;
    this.stats.pendingRequests = this.adoptionRequests.filter(r => r.status === 'pendiente').length;
    this.stats.approvedRequests = this.adoptionRequests.filter(r => r.status === 'aprobada').length;
    this.stats.rejectedRequests = this.adoptionRequests.filter(r => r.status === 'rechazada').length;
  }

  openCancelModal(request: AdoptionRequest) {
    this.requestToCancel = request;
    this.cancellationReason = '';
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.requestToCancel = null;
    this.cancellationReason = '';
  }

  async confirmCancellation() {
    if (!this.requestToCancel) return;

    this.cancellingRequest = true;
    try {

      await this.adoptionService.cancelAdoptionRequest(
        this.requestToCancel.id,
        this.cancellationReason
      );

      // Enviar notificación al rescatista
      const dogName = this.requestToCancel.dog?.name || 'el perro';
      const message = `El adoptante ${this.currentUserName} ha cancelado su solicitud de adopción para ${dogName}.${this.cancellationReason ? '\n\nMotivo: ' + this.cancellationReason : ''}`;

      await this.messageService.sendMessage(
        this.requestToCancel.rescuer_id,
        message,
        this.requestToCancel.dog_id
      );

      // Recargar solicitudes

      await this.loadAdoptionRequests();

      // Forzar detección de cambios
      this.cdr.detectChanges();

      this.closeCancelModal();
      this.error = '';
    } catch (err: any) {
      console.error('Error en confirmCancellation:', err);
      this.error = err.message || 'Error al cancelar la solicitud';
    } finally {
      this.cancellingRequest = false;
    }
  }

  async cancelRequest(requestId: string) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) return;
    
    try {
      await this.adoptionService.updateAdoptionStatus(requestId, 'rechazada');
      await this.loadAdoptionRequests();
    } catch (err: any) {
      this.error = err.message || 'Error al cancelar la solicitud';
    }
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pendiente: 'Pendiente',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada',
      completada: 'Completada',
      cancelada_por_adoptante: 'Cancelada'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pendiente: 'yellow',
      aprobada: 'green',
      rechazada: 'red',
      completada: 'purple'
    };
    return colors[status] || 'gray';
  }

  getFilteredRequests(status?: string): AdoptionRequest[] {
    if (!status) return this.adoptionRequests;
    return this.adoptionRequests.filter(r => r.status === status);
  }
}
