import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrgencyLevel } from '../../models/dog.model';

@Component({
  selector: 'app-urgency-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="urgencyLevel && urgencyLevel !== 'normal'" [class]="badgeClass">
      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <span class="font-bold">{{ badgeText }}</span>
      <span *ngIf="daysInShelter && daysInShelter > 0" class="ml-1 text-xs opacity-90">
        ({{ daysInShelter }} días)
      </span>
    </div>
  `,
  styles: []
})
export class UrgencyBadgeComponent {
  @Input() urgencyLevel?: UrgencyLevel;
  @Input() daysInShelter?: number;

  get badgeClass(): string {
    const baseClass = 'flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse';
    
    switch (this.urgencyLevel) {
      case 'urgente':
        return `${baseClass} bg-red-600 text-white`;
      case 'alto':
        return `${baseClass} bg-orange-500 text-white`;
      default:
        return baseClass;
    }
  }

  get badgeText(): string {
    switch (this.urgencyLevel) {
      case 'urgente':
        return 'URGENTE';
      case 'alto':
        return 'PRIORIDAD ALTA';
      default:
        return '';
    }
  }
}
