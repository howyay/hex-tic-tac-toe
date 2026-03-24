import { describe, it, expect } from 'vitest';
import { formatTime, TIMER_WARNING_THRESHOLD, DEFAULT_TIMER_MODE } from './timer';
import type { TimerMode, TimerConfig } from './timer';

describe('formatTime', () => {
  it('formats 0 as "0:00"', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats 9 as "0:09"', () => {
    expect(formatTime(9)).toBe('0:09');
  });

  it('formats 30 as "0:30"', () => {
    expect(formatTime(30)).toBe('0:30');
  });

  it('formats 60 as "1:00"', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('formats 75 as "1:15"', () => {
    expect(formatTime(75)).toBe('1:15');
  });
});

describe('Timer constants', () => {
  it('TIMER_WARNING_THRESHOLD equals 10', () => {
    expect(TIMER_WARNING_THRESHOLD).toBe(10);
  });

  it('DEFAULT_TIMER_MODE equals 60', () => {
    expect(DEFAULT_TIMER_MODE).toBe(60);
  });
});

describe('TimerConfig type', () => {
  it('accepts valid TimerConfig with mode field', () => {
    const config: TimerConfig = { mode: 60 };
    expect(config.mode).toBe(60);
  });

  it('accepts all valid TimerMode values', () => {
    const modes: TimerMode[] = [30, 60, 0];
    expect(modes).toEqual([30, 60, 0]);
  });
});
