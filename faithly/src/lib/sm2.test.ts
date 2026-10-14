import { describe, expect, it } from 'vitest';
import { review } from './sm2';
import { seeded, shuffle } from './random';

describe('sm2', () => {
  it('grows the interval on good answers and resets on again', () => {
    let c = { ease: 2.5, interval_days: 0, repetitions: 0 };
    c = review(c, 4); expect(c.interval_days).toBe(1);
    c = review(c, 4); expect(c.interval_days).toBe(3);
    c = review(c, 5); expect(c.interval_days).toBeGreaterThan(6);
    c = review(c, 0); expect(c.interval_days).toBe(0);
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
  });
});

describe('seeded shuffle', () => {
  it('is deterministic for the same seed', () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded(42))).toEqual(shuffle([1, 2, 3, 4, 5], seeded(42)));
  });
});
