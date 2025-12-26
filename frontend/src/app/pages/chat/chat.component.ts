import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { Message, Conversation } from '../../models/features.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer?: ElementRef;

  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedConversation: Conversation | null = null;
  newMessage = '';
  loading = true;
  loadingMessages = false;
  sendingMessage = false;
  currentUserId: string | null = null;
  showMobileConversations = true;
  
  private messagesSubscription?: Subscription;
  private unreadSubscription?: Subscription;
  unreadCount = 0;

  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.error('No authenticated user');
      this.loading = false;
      return;
    }

    this.currentUserId = user.id;
    await this.loadConversations();
    
    // Suscribirse al contador de no leídos
    this.unreadSubscription = this.messageService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });

    // Cargar contador inicial
    await this.messageService.getUnreadCount(this.currentUserId);
    
    this.loading = false;
  }

  async loadConversations() {
    if (!this.currentUserId) return;
    
    try {

      this.conversations = await this.messageService.getConversations(this.currentUserId);

    } catch (error: any) {
      console.error('Error loading conversations:', error);
      console.error('Detalles del error:', error.message, error.details);
    }
  }

  async selectConversation(conversation: Conversation) {

    this.selectedConversation = conversation;
    this.showMobileConversations = false;
    this.loadingMessages = true;

    try {
      if (!this.currentUserId) return;

      // Cargar mensajes
      this.messages = await this.messageService.getMessages(
        this.currentUserId,
        conversation.user_id,
        conversation.dog_id
      );

      // Actualizar el subject con los mensajes cargados
      this.messageService.setMessages(this.messages);

      // Marcar mensajes como leídos
      const unreadMessages = this.messages
        .filter(m => m.receiver_id === this.currentUserId && !m.is_read)
        .map(m => m.id);
      
      if (unreadMessages.length > 0) {
        await this.messageService.markAsRead(unreadMessages);
        await this.loadConversations();
        await this.messageService.getUnreadCount(this.currentUserId);
      }

      // Suscribirse a mensajes en tiempo real
      this.messageService.subscribeToMessages(this.currentUserId, conversation.user_id);
      
      // Suscribirse al observable de mensajes (para nuevos mensajes en tiempo real)
      this.messagesSubscription = this.messageService.messages$.subscribe(messages => {

        this.messages = messages;
        setTimeout(() => this.scrollToBottom(), 100);
      });

      // Scroll al final
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      this.loadingMessages = false;

    }
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation || this.sendingMessage) return;

    this.sendingMessage = true;
    const messageText = this.newMessage.trim();
    this.newMessage = '';

    try {
      const message = await this.messageService.sendMessage(
        this.selectedConversation.user_id,
        messageText,
        this.selectedConversation.dog_id
      );

      this.messages.push(message);
      await this.loadConversations();
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      this.newMessage = messageText; // Restaurar mensaje si falla
    } finally {
      this.sendingMessage = false;
    }
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  backToConversations() {
    this.showMobileConversations = true;
    this.selectedConversation = null;
    this.messageService.unsubscribeFromMessages();
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  isOwnMessage(message: Message): boolean {
    return message.sender_id === this.currentUserId;
  }

  getUserName(conversation: Conversation): string {
    return conversation.user_name || 'Usuario';
  }

  getUserAvatar(conversation: Conversation): string {
    return conversation.user_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(conversation.user_name);
  }

  getOtherUserName(message: Message): string {
    if (this.isOwnMessage(message)) {
      return message.receiver ? `${message.receiver.first_name} ${message.receiver.last_name}` : 'Usuario';
    }
    return message.sender ? `${message.sender.first_name} ${message.sender.last_name}` : 'Usuario';
  }

  ngOnDestroy() {
    this.messageService.unsubscribeFromMessages();
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    if (this.unreadSubscription) {
      this.unreadSubscription.unsubscribe();
    }
  }
}
