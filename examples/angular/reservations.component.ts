import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { mountReservations, type ReservationWidget, type WidgetLanguage } from '@menueqr/widget';

@Component({
  selector: 'app-reservations',
  standalone: true,
  template: '<div #target></div>',
})
export class ReservationsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) restaurant!: string;
  @Input() language: WidgetLanguage = 'de';
  @ViewChild('target', { static: true }) target!: ElementRef<HTMLElement>;
  private platformId = inject(PLATFORM_ID);
  private widget?: ReservationWidget;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.widget = mountReservations(this.target.nativeElement, {
      restaurant: this.restaurant,
      language: this.language,
      mode: 'button',
    });
  }

  ngOnChanges(): void {
    this.widget?.update({ restaurant: this.restaurant, language: this.language });
  }

  ngOnDestroy(): void {
    this.widget?.destroy();
  }
}
