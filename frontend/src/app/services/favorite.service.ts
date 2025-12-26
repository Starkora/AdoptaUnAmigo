import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Favorite } from '../models/features.model';
import { Dog } from '../models/dog.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private supabase: SupabaseClient;
  private favoritesSubject = new BehaviorSubject<Set<string>>(new Set());
  public favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async loadUserFavorites(userId: string) {
    const { data, error } = await this.supabase
      .from('favorites')
      .select('dog_id')
      .eq('user_id', userId);

    if (!error && data) {
      const favoriteIds = new Set(data.map(f => f.dog_id));
      this.favoritesSubject.next(favoriteIds);
    }
  }

  async getFavorites(userId: string): Promise<Dog[]> {
    const { data, error } = await this.supabase
      .from('favorites')
      .select(`
        dog:dogs(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => item.dog).filter((dog: any) => dog !== null) as Dog[];
  }

  async toggleFavorite(userId: string, dogId: string): Promise<boolean> {
    const currentFavorites = this.favoritesSubject.value;
    const isFavorite = currentFavorites.has(dogId);

    if (isFavorite) {
      // Remove favorite
      const { error } = await this.supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('dog_id', dogId);

      if (error) throw error;
      
      currentFavorites.delete(dogId);
      this.favoritesSubject.next(new Set(currentFavorites));
      return false;
    } else {
      // Add favorite
      const { error } = await this.supabase
        .from('favorites')
        .insert({ user_id: userId, dog_id: dogId });

      if (error) throw error;
      
      currentFavorites.add(dogId);
      this.favoritesSubject.next(new Set(currentFavorites));
      return true;
    }
  }

  isFavorite(dogId: string): boolean {
    return this.favoritesSubject.value.has(dogId);
  }

  async getFavoriteCount(dogId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('dog_id', dogId);

    if (error) throw error;
    return count || 0;
  }
}
