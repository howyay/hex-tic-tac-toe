// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateGameId, parseGameIdFromHash, buildShareLink } from './connection';

describe('generateGameId', () => {
  it('produces an 8-character string', () => {
    const id = generateGameId();
    expect(id).toHaveLength(8);
  });

  it('produces only alphanumeric lowercase characters', () => {
    // Generate several IDs to increase confidence
    for (let i = 0; i < 50; i++) {
      const id = generateGameId();
      expect(id).toMatch(/^[a-z0-9]{8}$/);
    }
  });
});

describe('parseGameIdFromHash', () => {
  const originalHash = window.location.hash;

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('returns null for empty hash', () => {
    window.location.hash = '';
    expect(parseGameIdFromHash()).toBeNull();
  });

  it('returns null for short hash (< 6 chars)', () => {
    window.location.hash = '#abc';
    expect(parseGameIdFromHash()).toBeNull();
  });

  it('returns the ID for a valid hash', () => {
    window.location.hash = '#abcd1234';
    expect(parseGameIdFromHash()).toBe('abcd1234');
  });

  it('returns the ID for exactly 6 chars', () => {
    window.location.hash = '#abcdef';
    expect(parseGameIdFromHash()).toBe('abcdef');
  });
});

describe('buildShareLink', () => {
  it('constructs a link with the game ID as hash', () => {
    const link = buildShareLink('testgame');
    expect(link).toContain('#testgame');
    expect(link).toMatch(/^https?:\/\/.+#testgame$/);
  });
});
