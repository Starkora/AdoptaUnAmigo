import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Message, Conversation } from '../models/features.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private supabase: SupabaseClient;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  private messageChannel?: RealtimeChannel;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  setMessages(messages: Message[]): void {
    this.messagesSubject.next(messages);
  }

  async getMessages(userId: string, otherUserId: string, dogId?: string): Promise<Message[]> {

    let query = this.supabase
      .from('messages')
      .select(`
        *,
        sender:user_profiles!sender_id(first_name, last_name, avatar_url),
        receiver:user_profiles!receiver_id(first_name, last_name, avatar_url),
        dog:dogs(name, main_image_url)
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (dogId) {

      query = query.eq('dog_id', dogId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error cargando mensajes:', error);
      throw error;
    }

    return data as Message[];
  }

  async sendMessage(receiverId: string, message: string, dogId?: string): Promise<Message> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        dog_id: dogId,
        message: message
      })
      .select(`
        *,
        sender:user_profiles!sender_id(first_name, last_name, avatar_url),
        receiver:user_profiles!receiver_id(first_name, last_name, avatar_url),
        dog:dogs(name, main_image_url)
      `)
      .single();

    if (error) throw error;
    return data as Message;
  }

  async markAsRead(messageIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds);

    if (error) throw error;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    this.unreadCountSubject.next(count || 0);
    return count || 0;
  }

  subscribeToMessages(userId: string, otherUserId: string): void {
    if (this.messageChannel) {
      this.supabase.removeChannel(this.messageChannel);
    }

    this.messageChannel = this.supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${otherUserId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.receiver_id === userId) {
            const currentMessages = this.messagesSubject.value;
            this.messagesSubject.next([...currentMessages, newMessage]);
            this.getUnreadCount(userId);
          }
        }
      )
      .subscribe();
  }

  unsubscribeFromMessages(): void {
    if (this.messageChannel) {
      this.supabase.removeChannel(this.messageChannel);
      this.messageChannel = undefined;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  }

  async getConversations(userId: string): Promise<Conversation[]> {

    const { data, error } = await this.supabase
      .rpc('get_conversations', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error fetching conversations:', error);
      console.error('Código:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);
      console.error('Hint:', error.hint);
      return [];
    }

    return data as Conversation[];
  }
}
