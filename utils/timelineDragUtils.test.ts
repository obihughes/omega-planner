import {
  getHourFromPointerInSegment,
  getPeriodBaseHour,
  getPeriodForHour,
  getPixelsPerHourFromRect,
  isPointerNearTimelineZone,
  snapHourToQuarter,
  TIMELINE_PERIOD_HOURS,
} from './timelineDragUtils';

describe('timelineDragUtils', () => {
  describe('getPixelsPerHourFromRect', () => {
    it('divides width by period hours', () => {
      expect(getPixelsPerHourFromRect(600)).toBe(100);
      expect(getPixelsPerHourFromRect(1266, TIMELINE_PERIOD_HOURS)).toBe(211);
    });
  });

  describe('getPeriodBaseHour', () => {
    it('maps each period to its start hour', () => {
      expect(getPeriodBaseHour('night')).toBe(0);
      expect(getPeriodBaseHour('morning')).toBe(6);
      expect(getPeriodBaseHour('afternoon')).toBe(12);
      expect(getPeriodBaseHour('evening')).toBe(18);
    });
  });

  describe('getPeriodForHour', () => {
    it('returns the period containing a start hour', () => {
      expect(getPeriodForHour(2)).toBe('night');
      expect(getPeriodForHour(8)).toBe('morning');
      expect(getPeriodForHour(14)).toBe('afternoon');
      expect(getPeriodForHour(20)).toBe('evening');
    });
  });

  describe('getHourFromPointerInSegment', () => {
    it('computes hour from pointer position using segment width', () => {
      const contentRect = { left: 100, width: 600 } as DOMRect;
      // relativeX = 400 - 100 - 50 = 250; hourPixels = 100; hourInBlock = 2.5; base 6 -> 8.5
      expect(getHourFromPointerInSegment(400, contentRect, 50, 6)).toBeCloseTo(8.5);
    });

    it('matches drop-zone math at segment origin', () => {
      const contentRect = { left: 0, width: 1200 } as DOMRect;
      expect(getHourFromPointerInSegment(600, contentRect, 0, 12)).toBeCloseTo(15);
    });
  });

  describe('snapHourToQuarter', () => {
    it('snaps to 15-minute increments', () => {
      expect(snapHourToQuarter(8.13)).toBe(8.25);
      expect(snapHourToQuarter(8.1)).toBe(8);
    });
  });

  describe('isPointerNearTimelineZone', () => {
    it('returns true when pointer is inside the zone', () => {
      const el = document.createElement('div');
      el.getBoundingClientRect = () =>
        ({ left: 100, right: 700, top: 50, bottom: 170 } as DOMRect);

      expect(isPointerNearTimelineZone(400, 100, el)).toBe(true);
    });

    it('returns true within padding of the zone edge', () => {
      const el = document.createElement('div');
      el.getBoundingClientRect = () =>
        ({ left: 100, right: 700, top: 50, bottom: 170 } as DOMRect);

      expect(isPointerNearTimelineZone(750, 100, el, 80)).toBe(true);
    });

    it('returns false when pointer is far from the zone', () => {
      const el = document.createElement('div');
      el.getBoundingClientRect = () =>
        ({ left: 100, right: 700, top: 50, bottom: 170 } as DOMRect);

      expect(isPointerNearTimelineZone(900, 400, el, 20)).toBe(false);
    });
  });
});
