import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Review, CreateReviewDto } from '../models/features.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getRescuerReviews(rescuerId: string): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select(`
        *,
        reviewer:user_profiles!reviewer_id(first_name, last_name, avatar_url),
        dog:dogs(name, main_image_url)
      `)
      .eq('rescuer_id', rescuerId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Review[];
  }

  async createReview(reviewerId: string, dto: CreateReviewDto): Promise<Review> {
    const { data, error} = await this.supabase
      .from('reviews')
      .insert({
        reviewer_id: reviewerId,
        ...dto
      })
      .select(`
        *,
        reviewer:user_profiles!reviewer_id(first_name, last_name, avatar_url),
        dog:dogs(name, main_image_url)
      `)
      .single();

    if (error) throw error;
    return data as Review;
  }

  async updateReview(reviewId: string, rating: number, comment?: string): Promise<void> {
    const { error } = await this.supabase
      .from('reviews')
      .update({ rating, comment, updated_at: new Date().toISOString() })
      .eq('id', reviewId);

    if (error) throw error;
  }

  async deleteReview(reviewId: string): Promise<void> {
    const { error } = await this.supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
  }

  async canReview(reviewerId: string, rescuerId: string, dogId?: string): Promise<boolean> {
    // Check if user has already reviewed
    let query = this.supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', reviewerId)
      .eq('rescuer_id', rescuerId);

    if (dogId) {
      query = query.eq('dog_id', dogId);
    }

    const { data, error } = await query;

    if (error) return false;
    return !data || data.length === 0;
  }

  async getRescuerRating(rescuerId: string): Promise<{ average: number; count: number }> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('rating_average, rating_count')
      .eq('id', rescuerId)
      .single();

    if (error) return { average: 0, count: 0 };
    return {
      average: data.rating_average || 0,
      count: data.rating_count || 0
    };
  }
}
