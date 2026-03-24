/** Timer mode: 30s, 60s, or 0 (unlimited) */
export type TimerMode = 30 | 60 | 0;

/** Timer configuration for a game */
export interface TimerConfig {
  mode: TimerMode;
}

/** Default timer mode: 60 seconds per turn (D-07) */
export const DEFAULT_TIMER_MODE: TimerMode = 60;

/** Warning threshold in seconds -- UI shows red at this point (D-04) */
export const TIMER_WARNING_THRESHOLD = 10;

/** Format seconds as m:ss string (e.g., 75 -> "1:15", 9 -> "0:09") */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
