import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserProfile } from '../../../models/user.model';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  currentUser: UserProfile | null = null;
  loading = false;
  error = '';
  successMessage = '';
  
  // Form data
  profileForm = {
    first_name: '',
    last_name: '',
    phone: '',
    organization_name: ''
  };

  // Password change
  showPasswordForm = false;
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseKey
  );

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user as unknown as UserProfile;
    }
    
    if (this.currentUser) {
      this.profileForm = {
        first_name: this.currentUser.first_name,
        last_name: this.currentUser.last_name,
        phone: this.currentUser.phone || '',
        organization_name: this.currentUser.organization_name || ''
      };
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  async updateProfile() {
    if (!this.currentUser) return;

    try {
      this.loading = true;
      this.error = '';
      this.successMessage = '';

      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          first_name: this.profileForm.first_name,
          last_name: this.profileForm.last_name,
          phone: this.profileForm.phone || undefined,
          organization_name: this.profileForm.organization_name || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentUser.id);

      if (error) throw error;

      // Update local user data
      this.currentUser = {
        ...this.currentUser,
        first_name: this.profileForm.first_name,
        last_name: this.profileForm.last_name,
        phone: this.profileForm.phone || undefined,
        organization_name: this.profileForm.organization_name || undefined
      };

      this.successMessage = 'Perfil actualizado exitosamente';
      setTimeout(() => this.successMessage = '', 3000);
    } catch (err: any) {
      this.error = err.message || 'Error al actualizar el perfil';
    } finally {
      this.loading = false;
    }
  }

  async changePassword() {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    try {
      this.loading = true;
      this.error = '';
      this.successMessage = '';

      const { error } = await this.supabase.auth.updateUser({
        password: this.passwordForm.newPassword
      });

      if (error) throw error;

      this.successMessage = 'Contraseña actualizada exitosamente';
      this.showPasswordForm = false;
      this.resetPasswordForm();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (err: any) {
      this.error = err.message || 'Error al cambiar la contraseña';
    } finally {
      this.loading = false;
    }
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.resetPasswordForm();
    }
  }

  resetPasswordForm() {
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/auth/login']);
  }

  getRoleName(role: string): string {
    return role === 'rescatista' ? 'Rescatista' : 'Adoptante';
  }

  isRescuer(): boolean {
    return this.currentUser?.role === 'rescatista';
  }
}
