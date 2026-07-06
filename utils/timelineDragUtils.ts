import {
  TIMELINE_START_HOUR,
  TIMELINE_SPLIT_HOUR_1,
  TIMELINE_SPLIT_HOUR_2,
  TIMELINE_SPLIT_HOUR_3,
} from '@/lib/constants';

export type TimelinePeriod = 'night' | 'morning' | 'afternoon' | 'evening';

export const TIMELINE_PERIOD_HOURS = 6;

export interface TimelineDropZoneRef {
  dayOffset: number;
  period: TimelinePeriod;
}

export interface TimelineDropZoneInfo extends TimelineDropZoneRef {
  element: HTMLElement;
  contentRect: DOMRect;
}

const TIMELINE_DROP_SELECTOR = '[data-timeline-drop]';

export function getPeriodBaseHour(period: TimelinePeriod): number {
  switch (period) {
    case 'night':
      return TIMELINE_START_HOUR;
    case 'morning':
      return TIMELINE_SPLIT_HOUR_1;
    case 'afternoon':
      return TIMELINE_SPLIT_HOUR_2;
    case 'evening':
      return TIMELINE_SPLIT_HOUR_3;
  }
}

export function getPeriodForHour(startHour: number): TimelinePeriod {
  if (startHour < TIMELINE_SPLIT_HOUR_1) return 'night';
  if (startHour < TIMELINE_SPLIT_HOUR_2) return 'morning';
  if (startHour < TIMELINE_SPLIT_HOUR_3) return 'afternoon';
  return 'evening';
}

export function getPixelsPerHourFromRect(
  width: number,
  periodHours: number = TIMELINE_PERIOD_HOURS
): number {
  return width / periodHours;
}

export function getDropZoneContentRect(dropEl: HTMLElement): DOMRect {
  const area = dropEl.querySelector('[data-testid^="timeline-area-"]') as HTMLElement | null;
  return (area ?? dropEl).getBoundingClientRect();
}

export function parseTimelineDropZone(element: HTMLElement): TimelineDropZoneInfo | null {
  const dropEl = element.closest(TIMELINE_DROP_SELECTOR) as HTMLElement | null;
  if (!dropEl) return null;

  const dayOffsetAttr = dropEl.getAttribute('data-day-offset');
  const periodAttr = dropEl.getAttribute('data-section-period') as TimelinePeriod | null;
  if (!dayOffsetAttr || !periodAttr) return null;

  const dayOffset = parseInt(dayOffsetAttr, 10);
  if (Number.isNaN(dayOffset)) return null;

  return {
    dayOffset,
    period: periodAttr,
    element: dropEl,
    contentRect: getDropZoneContentRect(dropEl),
  };
}

export function findTimelineDropZone(
  clientX: number,
  clientY: number
): TimelineDropZoneInfo | null {
  const elementUnderMouse = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
  if (!elementUnderMouse) return null;
  return parseTimelineDropZone(elementUnderMouse);
}

export function queryTimelineDropZone(
  dayOffset: number,
  period: TimelinePeriod
): HTMLElement | null {
  return document.querySelector(
    `${TIMELINE_DROP_SELECTOR}[data-day-offset="${dayOffset}"][data-section-period="${period}"]`
  ) as HTMLElement | null;
}

/** True when the pointer is still over or near a timeline segment (headers/gaps between panels). */
export function isPointerNearTimelineZone(
  clientX: number,
  clientY: number,
  dropEl: HTMLElement,
  paddingPx = 80
): boolean {
  const rect = dropEl.getBoundingClientRect();
  return (
    clientX >= rect.left - paddingPx &&
    clientX <= rect.right + paddingPx &&
    clientY >= rect.top - paddingPx &&
    clientY <= rect.bottom + paddingPx
  );
}

export function resolveTimelineDropZone(
  clientX: number,
  clientY: number,
  lastValidZone: TimelineDropZoneRef | null | undefined
): TimelineDropZoneInfo | null {
  const direct = findTimelineDropZone(clientX, clientY);
  if (direct) return direct;

  if (!lastValidZone) return null;

  const el = queryTimelineDropZone(lastValidZone.dayOffset, lastValidZone.period);
  if (!el || !isPointerNearTimelineZone(clientX, clientY, el)) return null;

  return parseTimelineDropZone(el);
}

export function getHourFromPointerInSegment(
  clientX: number,
  contentRect: DOMRect,
  offsetX: number,
  baseHour: number,
  periodHours: number = TIMELINE_PERIOD_HOURS
): number {
  const hourPixels = getPixelsPerHourFromRect(contentRect.width, periodHours);
  const relativeX = clientX - contentRect.left - offsetX;
  return baseHour + relativeX / hourPixels;
}

export function snapHourToQuarter(hour: number): number {
  return Math.round(hour * 4) / 4;
}
