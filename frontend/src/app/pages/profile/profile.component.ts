import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit, OnDestroy {
  profile: UserProfile | null = null;
  loading = true;
  currentUserName: string | null = null;
  private profileSubscription?: Subscription;
  
  // Estado de edición
  isEditMode = false;
  saving = false;
  editForm: any = {};
  
  // Estado de avatar
  uploadingAvatar = false;
  avatarPreview: string | null = null;
  showDeleteModal = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.profileSubscription = this.authService.currentProfile$.subscribe(profile => {
      if (profile) {
        this.profile = profile;
        this.currentUserName = `${profile.first_name} ${profile.last_name}`;
        this.loading = false;
        this.initEditForm();
      }
    });
  }

  ngOnDestroy() {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  initEditForm() {
    if (!this.profile) return;
    
    this.editForm = {
      first_name: this.profile.first_name,
      last_name: this.profile.last_name,
      phone: this.profile.phone || '',
      country: this.profile.country || 'Perú',
      province: this.profile.province || '',
      district: this.profile.district || '',
      address: this.profile.address || '',
      dni: this.profile.dni || '',
      birth_date: this.profile.birth_date || '',
      occupation: this.profile.occupation || '',
      home_type: this.profile.home_type || 'casa',
      has_yard: this.profile.has_yard || false,
      household_members: this.profile.household_members || null,
      has_pets: this.profile.has_pets || false,
      pet_experience: this.profile.pet_experience || '',
      why_adopt: this.profile.why_adopt || '',
      availability_hours: this.profile.availability_hours || '',
      economic_status: this.profile.economic_status || 'estable',
      organization_name: this.profile.organization_name || ''
    };
  }

  enableEditMode() {
    this.isEditMode = true;
    this.initEditForm();
  }

  cancelEdit() {
    this.isEditMode = false;
    this.initEditForm();
  }

  async saveProfile() {
    if (!this.profile) return;
    
    this.saving = true;
    
    try {
      await this.authService.updateProfile(this.editForm);
      
      this.toastr.success('Perfil actualizado correctamente');
      this.isEditMode = false;
      
      // El perfil se actualizará automáticamente vía la suscripción a currentProfile$
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      this.toastr.error(error.message || 'Error al actualizar el perfil');
    } finally {
      this.saving = false;
    }
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/']);
  }

  getRoleLabel(): string {
    return this.profile?.role === 'adoptante' ? 'Adoptante' : 'Rescatista';
  }

  getAge(): string {
    if (!this.profile?.birth_date) return 'No especificado';
    
    const birthDate = new Date(this.profile.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} años`;
  }

  onAvatarFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.toastr.error('Tipo de archivo no válido. Usa JPG, PNG o WEBP');
      return;
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toastr.error('El archivo es muy grande. Máximo 2MB');
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Subir archivo
    this.uploadAvatar(file);
  }

  async uploadAvatar(file: File) {
    this.uploadingAvatar = true;

    try {
      const url = await this.authService.uploadAvatar(file);
      this.toastr.success('Foto de perfil actualizada correctamente');
      this.avatarPreview = null;
    } catch (error: any) {
      console.error('Error subiendo avatar:', error);
      this.toastr.error(error.message || 'Error al subir la foto');
      this.avatarPreview = null;
    } finally {
      this.uploadingAvatar = false;
    }
  }

  async deleteAvatar() {
    this.showDeleteModal = false;
    this.uploadingAvatar = true;

    try {
      await this.authService.deleteAvatar();
      this.toastr.success('Foto de perfil eliminada');
    } catch (error: any) {
      console.error('Error eliminando avatar:', error);
      this.toastr.error('Error al eliminar la foto');
    } finally {
      this.uploadingAvatar = false;
    }
  }

  openDeleteModal() {
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  getAvatarUrl(): string {
    if (this.avatarPreview) {
      return this.avatarPreview;
    }
    if (this.profile?.avatar_url) {
      return this.profile.avatar_url;
    }
    // Avatar por defecto
    return 'https://ui-avatars.com/api/?name=' + 
           encodeURIComponent(this.currentUserName || 'Usuario') + 
           '&background=6366f1&color=ffffff&size=200';
  }
}
