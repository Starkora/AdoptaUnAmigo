import { Component, Input, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { register } from 'swiper/element/bundle';

// Registrar componentes de Swiper
register();

@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="photo-gallery">
      <!-- Galería principal -->
      <div class="main-gallery mb-4 relative">
        <swiper-container
          #mainSwiper
          navigation="true"
          pagination="true"
          zoom="true"
          keyboard="true"
          class="main-swiper rounded-lg overflow-hidden shadow-lg"
          (slidechange)="onSlideChange($event)">
          <swiper-slide *ngFor="let image of images; let i = index">
            <div class="swiper-zoom-container">
              <img 
                [src]="image" 
                [alt]="'Foto ' + (i + 1)"
                class="w-full h-full object-cover"
                (error)="onImageError($event)"
              />
            </div>
          </swiper-slide>
        </swiper-container>
        
        <!-- Contador de fotos -->
        <div class="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm z-10">
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>
      </div>

      <!-- Miniaturas (thumbnails) -->
      <div *ngIf="showThumbnails && images.length > 1" class="thumbnails-gallery">
        <div class="grid grid-cols-4 gap-2">
          <button
            *ngFor="let image of images; let i = index"
            (click)="goToSlide(i)"
            type="button"
            class="relative overflow-hidden rounded-lg transition-all cursor-pointer focus:outline-none">
            <img 
              [src]="image" 
              [alt]="'Miniatura ' + (i + 1)"
              class="w-full h-20 object-cover transition-all"
              [class.ring-2]="i === currentIndex"
              [class.ring-indigo-600]="i === currentIndex"
              [class.opacity-50]="i !== currentIndex"
              [class.hover:opacity-100]="i !== currentIndex"
              (error)="onImageError($event)"
            />
          </button>
        </div>
      </div>

      <!-- Vista de galería completa (opcional) -->
      <div *ngIf="showFullscreen" class="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <button 
          (click)="closeFullscreen()"
          class="absolute top-4 right-4 text-white hover:text-gray-300 z-50">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <swiper-container
          navigation="true"
          pagination="true"
          zoom="true"
          keyboard="true"
          class="w-full h-full"
          [attr.initial-slide]="currentIndex">
          <swiper-slide *ngFor="let image of images; let i = index">
            <div class="swiper-zoom-container flex items-center justify-center h-full">
              <img 
                [src]="image" 
                [alt]="'Foto ' + (i + 1)"
                class="max-w-full max-h-full object-contain"
                (error)="onImageError($event)"
              />
            </div>
          </swiper-slide>
        </swiper-container>
      </div>
    </div>
  `,
  styles: [`
    .photo-gallery {
      position: relative;
    }

    .main-swiper {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #f3f4f6;
    }

    swiper-container::part(button-prev),
    swiper-container::part(button-next) {
      color: white;
      background: rgba(0, 0, 0, 0.5);
      padding: 20px;
      border-radius: 50%;
      width: 40px;
      height: 40px;
    }

    swiper-container::part(button-prev):hover,
    swiper-container::part(button-next):hover {
      background: rgba(0, 0, 0, 0.8);
    }

    swiper-container::part(pagination) {
      bottom: 10px;
    }

    swiper-container::part(bullet) {
      background: white;
      opacity: 0.5;
    }

    swiper-container::part(bullet-active) {
      opacity: 1;
      background: #4f46e5;
    }

    .swiper-zoom-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class PhotoGalleryComponent implements AfterViewInit {
  @ViewChild('mainSwiper') mainSwiperRef!: ElementRef;
  @Input() images: string[] = [];
  @Input() showThumbnails: boolean = true;
  @Input() allowFullscreen: boolean = true;

  currentIndex = 0;
  showFullscreen = false;
  private swiperElement: any;

  ngAfterViewInit() {
    this.swiperElement = this.mainSwiperRef?.nativeElement;
    
    // Configurar swiper después de que se inicialice
    if (this.swiperElement) {
      const swiperParams = {
        navigation: true,
        pagination: {
          clickable: true,
          dynamicBullets: true
        },
        zoom: true,
        keyboard: {
          enabled: true
        },
        on: {
          slideChange: () => {
            if (this.swiperElement.swiper) {
              this.currentIndex = this.swiperElement.swiper.activeIndex;
            }
          }
        }
      };
      
      Object.assign(this.swiperElement, swiperParams);
      this.swiperElement.initialize();
    }
  }

  onSlideChange(event: any) {
    if (event.target?.swiper) {
      this.currentIndex = event.target.swiper.activeIndex;
    }
  }

  goToSlide(index: number) {
    if (this.swiperElement?.swiper) {
      this.swiperElement.swiper.slideTo(index);
    }
  }

  openFullscreen() {
    if (this.allowFullscreen) {
      this.showFullscreen = true;
    }
  }

  closeFullscreen() {
    this.showFullscreen = false;
  }

  onImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/800x600?text=Imagen+no+disponible';
  }
}
