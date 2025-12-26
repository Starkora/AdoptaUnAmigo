import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfile, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null | undefined>(undefined);
  public currentUser$ = this.currentUserSubject.asObservable();

  private currentProfileSubject = new BehaviorSubject<UserProfile | null | undefined>(undefined);
  public currentProfile$ = this.currentProfileSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    
    // Cargar usuario actual si existe
    this.loadUser();
    
    // Escuchar cambios de autenticación
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        this.currentUserSubject.next(session.user);
        this.loadUserProfile(session.user.id);
      } else {
        this.currentUserSubject.next(null);
        this.currentProfileSubject.next(null);
      }
    });
  }

  private async loadUser() {

    const { data: { user } } = await this.supabase.auth.getUser();
    if (user) {

      this.currentUserSubject.next(user);
      await this.loadUserProfile(user.id);
    } else {

    }
  }

  private async loadUserProfile(userId: string) {

    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data && !error) {

      this.currentProfileSubject.next(data);
    } else {
      console.error('[AUTH] Error cargando perfil:', error);
    }
  }

  async signUp(email: string, password: string, firstName: string, lastName: string, role: UserRole, organizationName?: string) {

    // Registrar usuario en Supabase Auth con metadata
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
          organization_name: organizationName || null
        }
      }
    });

    if (authError) {
      console.error('Error en signUp auth:', authError);
      throw authError;
    }
    if (!authData.user) {
      console.error('No se creó el usuario');
      throw new Error('No se pudo crear el usuario');
    }

    return authData;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    
    // Cargar el perfil del usuario después del login
    if (data.user) {
      await this.loadUserProfile(data.user.id);
    }
    
    return data;
  }

  async signOut() {
    // Cerrar sesión globalmente (elimina tokens, cookies, sesión del servidor)
    const { error } = await this.supabase.auth.signOut({ scope: 'global' });
    if (error) throw error;
    
    // Limpiar estados locales
    this.currentUserSubject.next(null);
    this.currentProfileSubject.next(null);

  }

  async updateProfile(updates: Partial<UserProfile>) {
    const user = this.currentUserSubject.value;
    if (!user) throw new Error('No hay usuario autenticado');

    const { data, error } = await this.supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    this.currentProfileSubject.next(data);
    return data;
  }

  // Método para crear perfil completo (usado durante el registro)
  async createCompleteProfile(userId: string, profileData: any) {


    // Llamar a la función de Supabase que bypasea RLS
    const { data, error } = await this.supabase
      .rpc('create_complete_user_profile', {
        user_id: userId,
        profile_data: profileData
      });

    if (error) {
      console.error('Error creando perfil completo:', error);
      throw error;
    }

    return data;
  }

  // Método para actualizar perfil directamente con userId (útil después del registro)
  async updateProfileById(userId: string, updates: Partial<UserProfile>) {


    // Esperar y reintentar hasta 5 veces (1 segundo entre cada intento)
    let profileExists = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!profileExists && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: existingProfile, error: fetchError } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (!fetchError && existingProfile) {
        profileExists = true;
      }
    }
    
    if (!profileExists) {
      console.error('El perfil no se creó después de 5 intentos');
      throw new Error('El perfil del usuario no se creó. Por favor contacta al soporte.');
    }

    const { data, error } = await this.supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.error('La actualización no afectó ninguna fila');
      throw new Error('No se pudo actualizar el perfil');
    }

    return true;
  }

  getCurrentUser(): User | null | undefined {
    return this.currentUserSubject.value;
  }

  getCurrentProfile(): UserProfile | null | undefined {
    return this.currentProfileSubject.value;
  }

  isAuthenticated(): boolean {
    const user = this.currentUserSubject.value;
    return user !== null && user !== undefined;
  }

  isRescuer(): boolean {
    return this.currentProfileSubject.value?.role === 'rescatista';
  }

  isAdopter(): boolean {
    return this.currentProfileSubject.value?.role === 'adoptante';
  }

  async uploadAvatar(file: File): Promise<string> {
    const user = this.currentUserSubject.value;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no válido. Usa JPG, PNG o WEBP');
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('El archivo es muy grande. Máximo 2MB');
    }

    // Crear nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await this.supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error subiendo avatar:', error);
      throw new Error('Error al subir la imagen');
    }

    // Obtener URL pública
    const { data: { publicUrl } } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Actualizar perfil con la nueva URL
    await this.updateProfile({ avatar_url: publicUrl });

    return publicUrl;
  }

  async uploadPlacePhoto(userId: string, file: File): Promise<string> {
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no válido. Usa JPG, PNG o WEBP');
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('El archivo es muy grande. Máximo 5MB');
    }

    // Crear nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `place-photos/${userId}/${Date.now()}.${fileExt}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await this.supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error subiendo foto del lugar:', error);
      throw new Error('Error al subir la imagen');
    }

    // Obtener URL pública
    const { data: { publicUrl } } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  async deleteAvatar(): Promise<void> {
    const user = this.currentUserSubject.value;
    const profile = this.currentProfileSubject.value;
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    if (!profile?.avatar_url) {
      throw new Error('No hay avatar para eliminar');
    }

    // Extraer el path del archivo de la URL
    // URL ejemplo: https://xxx.supabase.co/storage/v1/object/public/avatars/user-id/timestamp.jpg
    let filePath: string;
    
    if (profile.avatar_url.includes('/avatars/')) {
      const urlParts = profile.avatar_url.split('/avatars/');
      filePath = urlParts[1];
    } else if (profile.avatar_url.includes('/object/public/avatars/')) {
      const urlParts = profile.avatar_url.split('/object/public/avatars/');
      filePath = urlParts[1];
    } else {
      throw new Error('URL de avatar no válida');
    }

    // Eliminar archivo de Storage
    const { error: deleteError } = await this.supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (deleteError) {
      console.error('Error eliminando de Storage:', deleteError);
      throw new Error('Error al eliminar el archivo del almacenamiento');
    }

    // Actualizar perfil removiendo la URL
    const { error: updateError } = await this.supabase
      .from('user_profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error actualizando perfil:', updateError);
      throw new Error('Error al actualizar el perfil');
    }

    // Actualizar el estado local
    this.currentProfileSubject.next({
      ...profile,
      avatar_url: undefined
    });
  }
}
