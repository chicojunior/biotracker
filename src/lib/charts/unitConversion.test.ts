import { describe, expect, it } from 'vitest';

import { convertToMetric } from './unitConversion';

describe('convertToMetric', () => {
  describe('identity cases', () => {
    it('returns value unchanged when fromUnit equals toUnit', () => {
      expect(convertToMetric(70, 'kg', 'kg')).toEqual({ value: 70, converted: false });
    });

    it('returns value unchanged when fromUnit equals toUnit case-insensitively', () => {
      expect(convertToMetric(70, 'KG', 'kg')).toEqual({ value: 70, converted: false });
    });

    it('returns value unchanged when fromUnit is null', () => {
      expect(convertToMetric(70, null, 'kg')).toEqual({ value: 70, converted: false });
    });

    it('returns value unchanged when fromUnit is undefined', () => {
      expect(convertToMetric(70, undefined, 'kg')).toEqual({ value: 70, converted: false });
    });
  });

  describe('lb/lbs → kg', () => {
    it('converts lb to kg', () => {
      const result = convertToMetric(150, 'lb', 'kg');
      expect(result.converted).toBe(true);
      expect(result.value).toBeCloseTo(68.04, 2);
    });

    it('converts lbs to kg', () => {
      const result = convertToMetric(150, 'lbs', 'kg');
      expect(result.converted).toBe(true);
      expect(result.value).toBeCloseTo(68.04, 2);
    });
  });

  describe('time → h', () => {
    it('converts min to h', () => {
      expect(convertToMetric(120, 'min', 'h')).toEqual({ value: 2, converted: true });
    });

    it('converts sec to h', () => {
      expect(convertToMetric(3600, 'sec', 'h')).toEqual({ value: 1, converted: true });
    });

    it('converts s to h', () => {
      expect(convertToMetric(3600, 's', 'h')).toEqual({ value: 1, converted: true });
    });
  });

  describe('unknown unit', () => {
    it('passes value through with converted: false and a warning', () => {
      const result = convertToMetric(10, 'stones', 'kg');
      expect(result.converted).toBe(false);
      expect(result.value).toBe(10);
      expect(result.warning).toContain('stones');
      expect(result.warning).toContain('kg');
    });
  });
});
