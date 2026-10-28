export const languages = ['de', 'en', 'fr', 'it', 'es', 'pt', 'pl', 'uk', 'tr'] as const;
export type WidgetLanguage = (typeof languages)[number];
export type WidgetMode = 'button' | 'floating' | 'tab' | 'inline';
export type CloseReason = 'api' | 'escape' | 'backdrop' | 'frame' | 'update' | 'destroy';
export interface ReservationWidgetOptions {
  /** Public restaurant slug or MenüQR menu link. No account credential. */
  restaurant: string;
  /** @deprecated Use a separate reservation component instead. */
  mode?: WidgetMode;
  language?: WidgetLanguage;
  color?: string;
  label?: string;
  side?: 'left' | 'right';
  offsetX?: number;
  offsetY?: number;
  mobile?: boolean;
  icon?: boolean;
  inlineHeight?: number;
  /** Optional server-generated CSP nonce for the widget's isolated styles. */
  nonce?: string;
  /** Production MenüQR or a loopback HTTP(S) origin for local fixtures only. */
  baseUrl?: string;
  onOpen?: (() => void) | undefined;
  onReady?: (() => void) | undefined;
  onClose?: ((event: { reason: CloseReason }) => void) | undefined;
}
export type WidgetConfiguration = Readonly<
  Required<Omit<ReservationWidgetOptions, 'onOpen' | 'onReady' | 'onClose'>> &
    Pick<ReservationWidgetOptions, 'onOpen' | 'onReady' | 'onClose'>
>;
export interface ReservationWidget {
  readonly isOpen: boolean;
  readonly options: WidgetConfiguration;
  /** Returns false for hidden widgets or browsers without native dialog support. */
  open(): boolean;
  close(): void;
  /** Validates before replacing the current view; closes an open overlay. */
  update(options: Partial<ReservationWidgetOptions>): void;
  /** Removes only this instance's DOM and listeners. Safe to call repeatedly. */
  destroy(): void;
}
/** Shared configuration for the four separate presentation components. */
export type ReservationComponentOptions = Omit<ReservationWidgetOptions, 'mode'>;
export interface ReservationComponent extends Omit<ReservationWidget, 'options' | 'update'> {
  readonly options: Omit<WidgetConfiguration, 'mode'>;
  update(options: Partial<ReservationComponentOptions>): void;
}
export type ReservationMount = (
  target: string | HTMLElement,
  options: ReservationComponentOptions,
) => ReservationComponent;
