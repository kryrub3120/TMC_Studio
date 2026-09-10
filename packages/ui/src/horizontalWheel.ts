import type { WheelEvent } from 'react';

/** Convert a vertical wheel gesture into movement within a horizontal strip. */
export function scrollHorizontalStrip(event: WheelEvent<HTMLElement>): void {
  const element = event.currentTarget;
  if (element.scrollWidth <= element.clientWidth) return;

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (delta === 0) return;

  const previous = element.scrollLeft;
  element.scrollLeft += delta;
  if (element.scrollLeft !== previous) event.preventDefault();
}
