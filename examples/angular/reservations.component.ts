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
import {
  mountReservationButton,
  type ReservationComponent,
  type WidgetLanguage,
} from '@menueqr/widget';

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
  private widget?: ReservationComponent;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.widget = mountReservationButton(this.target.nativeElement, {
      restaurant: this.restaurant,
      language: this.language,
    });
  }

  ngOnChanges(): void {
    this.widget?.update({ restaurant: this.restaurant, language: this.language });
  }

  ngOnDestroy(): void {
    this.widget?.destroy();
  }
}
