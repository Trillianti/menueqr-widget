'use client';
import { createElement, useEffect, useRef, type CSSProperties, type ReactElement } from 'react';
import { normalizeOptions } from '../options.js';
import type {
  ReservationComponent,
  ReservationComponentOptions,
  ReservationMount,
} from '../types.js';
export interface ReservationComponentProps extends ReservationComponentOptions {
  id?: string;
  className?: string;
  style?: CSSProperties;
}
/** Shared lifecycle, with a separate public component for each presentation. */
export function useReservationComponent(
  mount: ReservationMount,
  props: ReservationComponentProps,
): ReactElement {
  const target = useRef<HTMLDivElement>(null);
  const controller = useRef<ReservationComponent | null>(null);
  const { id, className, style, ...options } = props;
  useEffect(() => {
    if (!target.current) return;
    if (controller.current) {
      const { mode: _mode, ...next } = normalizeOptions(options);
      controller.current.update(next);
    } else controller.current = mount(target.current, options);
  });
  useEffect(
    () => () => {
      controller.current?.destroy();
      controller.current = null;
    },
    [],
  );
  return createElement('div', { ref: target, id, className, style });
}
