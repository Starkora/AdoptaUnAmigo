import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth.service';
import { UserRole, HomeType, EconomicStatus, RescuerType } from '../../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  // Paso actual del formulario (solo para adoptantes)
  currentStep = 1;
  totalSteps = 3;
  
  // Datos básicos
  email = '';
  password = '';
  confirmPassword = '';
  firstName = '';
  lastName = '';
  role: UserRole = 'adoptante';
  organizationName = '';
  phone = '';
  
  // Datos de ubicación
  country = 'Perú';
  province = '';
  district = '';
  address = '';
  
  // Datos personales
  dni = '';
  birthDate = '';
  occupation = '';
  
  // Datos de vivienda
  homeType: HomeType = 'casa';
  hasYard = false;
  householdMembers: number | null = null;
  
  // Experiencia con mascotas
  hasPets = false;
  petExperience = '';
  whyAdopt = '';
  availabilityHours = '';
  economicStatus: EconomicStatus = 'estable';
  
  // Datos adicionales para rescatistas
  rescuerType: RescuerType = 'individual';
  yearsExperience: number | null = null;
  rescueAddress = '';
  attentionHours = '';
  facebookUrl = '';
  instagramUrl = '';
  websiteUrl = '';
  followupProcess = '';
  placePhotoFile: File | null = null;
  placePhotoPreview: string | null = null;
  uploadingPlacePhoto = false;
  
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  passwordRequirements = {
    minLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasUpperCase: false,
    hasLowerCase: false
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  onPasswordChange() {
    this.passwordRequirements.minLength = this.password.length >= 8;
    this.passwordRequirements.hasNumber = /\d/.test(this.password);
    this.passwordRequirements.hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(this.password);
    this.passwordRequirements.hasUpperCase = /[A-Z]/.test(this.password);
    this.passwordRequirements.hasLowerCase = /[a-z]/.test(this.password);
  }

  isPasswordValid(): boolean {
    return Object.values(this.passwordRequirements).every(req => req === true);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  nextStep() {
    if (this.role === 'rescatista') {
      // Para rescatistas, ir directo al submit
      this.onSubmit();
      return;
    }

    // Validar paso actual antes de avanzar
    if (this.currentStep === 1 && !this.validateStep1()) {
      return;
    }
    if (this.currentStep === 2 && !this.validateStep2()) {
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.errorMessage = '';
    } else {
      this.onSubmit();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  validateStep1(): boolean {
    if (!this.email || !this.password || !this.firstName || !this.lastName || !this.phone) {
      this.errorMessage = 'Por favor completa todos los campos obligatorios';
      return false;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return false;
    }

    if (!this.isPasswordValid()) {
      this.errorMessage = 'La contraseña no cumple con todos los requisitos';
      return false;
    }

    return true;
  }

  validateStep2(): boolean {
    if (!this.province || !this.district || !this.address || !this.dni || !this.birthDate || !this.occupation) {
      this.errorMessage = 'Por favor completa todos los campos obligatorios';
      return false;
    }

    // Validar DNI (8 dígitos para Perú)
    if (!/^\d{8}$/.test(this.dni)) {
      this.errorMessage = 'El DNI debe tener 8 dígitos';
      return false;
    }

    // Validar edad mínima (18 años)
    const birthYear = new Date(this.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    if (currentYear - birthYear < 18) {
      this.errorMessage = 'Debes ser mayor de 18 años para adoptar';
      return false;
    }

    return true;
  }

  async onSubmit() {
    // Validación final
    if (this.role === 'rescatista') {
      // Validar campos básicos
      if (!this.email || !this.password || !this.firstName || !this.lastName) {
        this.errorMessage = 'Por favor completa todos los campos obligatorios';
        return;
      }

      // Validar campos adicionales obligatorios
      if (!this.yearsExperience || !this.rescueAddress || !this.followupProcess) {
        this.errorMessage = 'Por favor completa todos los campos obligatorios de información adicional';
        return;
      }

      // Validar organización/albergue necesita nombre
      if (this.needsSocialNetworks() && !this.organizationName) {
        this.errorMessage = 'Por favor ingresa el nombre de tu organización o albergue';
        return;
      }

      // Validar horario de atención para organización/albergue
      if (this.needsAttentionHours() && !this.attentionHours) {
        this.errorMessage = 'Por favor ingresa el horario de atención para visitas';
        return;
      }

      if (this.password !== this.confirmPassword) {
        this.errorMessage = 'Las contraseñas no coinciden';
        return;
      }

      if (!this.isPasswordValid()) {
        this.errorMessage = 'La contraseña no cumple con todos los requisitos';
        return;
      }
    } else {
      // Para adoptantes, validar todos los pasos
      if (!this.validateStep1() || !this.validateStep2()) {
        return;
      }

      if (!this.whyAdopt || !this.availabilityHours || this.householdMembers === null) {
        this.errorMessage = 'Por favor completa todos los campos obligatorios';
        return;
      }
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const result = await this.authService.signUp(
        this.email,
        this.password,
        this.firstName,
        this.lastName,
        this.role,
        this.organizationName
      );

      // Si es rescatista, crear perfil con información adicional
      if (this.role === 'rescatista' && result.user) {

        // Subir foto del lugar si existe
        let placePhotoUrl: string | undefined;
        if (this.placePhotoFile) {
          try {
            this.uploadingPlacePhoto = true;
            placePhotoUrl = await this.authService.uploadPlacePhoto(result.user.id, this.placePhotoFile);

          } catch (photoError) {
            console.error('Error subiendo foto del lugar:', photoError);
            this.toastr.warning('No se pudo subir la foto del lugar, pero el registro continúa');
          } finally {
            this.uploadingPlacePhoto = false;
          }
        }

        const profileData = {
          id: result.user.id,
          email: this.email,
          first_name: this.firstName,
          last_name: this.lastName,
          role: this.role,
          organization_name: this.organizationName,
          phone: this.phone,
          rescuer_type: this.rescuerType,
          years_experience: this.yearsExperience ? Number(this.yearsExperience) : null,
          rescue_address: this.rescueAddress,
          attention_hours: this.needsAttentionHours() ? this.attentionHours : null,
          social_networks: this.needsSocialNetworks() ? {
            facebook: this.facebookUrl || undefined,
            instagram: this.instagramUrl || undefined,
            website: this.websiteUrl || undefined
          } : null,
          followup_process: this.followupProcess,
          place_photo_url: placePhotoUrl
        };

        try {
          await this.authService.createCompleteProfile(result.user.id, profileData);

        } catch (profileError) {
          console.error('Error al crear perfil completo:', profileError);
        }
      }

      // Si es adoptante, crear/actualizar perfil con información completa
      if (this.role === 'adoptante' && result.user) {

        const profileData = {
          id: result.user.id,
          email: this.email,
          first_name: this.firstName,
          last_name: this.lastName,
          role: this.role,
          phone: this.phone,
          country: this.country,
          province: this.province,
          district: this.district,
          address: this.address,
          dni: this.dni,
          birth_date: this.birthDate,
          occupation: this.occupation,
          home_type: this.homeType,
          has_yard: Boolean(this.hasYard),
          household_members: Number(this.householdMembers),
          has_pets: Boolean(this.hasPets),
          pet_experience: this.petExperience,
          why_adopt: this.whyAdopt,
          availability_hours: String(this.availabilityHours),
          economic_status: this.economicStatus
        };

        try {
          await this.authService.createCompleteProfile(result.user.id, profileData);

        } catch (profileError) {
          console.error('Error al crear perfil completo:', profileError);
        }
      }

      // Mostrar notificación de éxito
      this.toastr.success(
        'Por favor confirma tu correo electrónico con el enlace que te hemos enviado para activar tu cuenta.',
        '¡Registro Exitoso!',
        {
          timeOut: 8000,
          progressBar: true,
          closeButton: true
        }
      );

      // Redirigir al login después de un breve delay
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al registrarse';
      this.toastr.error(this.errorMessage, 'Error en el registro');
    } finally {
      this.isLoading = false;
    }
  }

  onPlacePhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.toastr.error('Tipo de archivo no válido. Usa JPG, PNG o WEBP');
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toastr.error('El archivo es muy grande. Máximo 5MB');
      return;
    }

    this.placePhotoFile = file;

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.placePhotoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removePlacePhoto() {
    this.placePhotoFile = null;
    this.placePhotoPreview = null;
  }

  needsAttentionHours(): boolean {
    return this.rescuerType === 'organizacion' || this.rescuerType === 'albergue';
  }

  needsSocialNetworks(): boolean {
    return this.rescuerType === 'organizacion' || this.rescuerType === 'albergue';
  }
}
