# Phase 5: Turn Timer - Research

**Researched:** 2026-03-24
**Domain:** Timer synchronization, UI countdown, turn forfeiture in P2P game
**Confidence:** HIGH

## Summary

This phase adds a configurable turn timer to online games. The host selects a timer setting (30s, 60s, unlimited) before game creation, both players see a synchronized countdown, and expired timers forfeit remaining placements. The implementation touches four layers: (1) a pre-game timer selection UI inserted between "Online Game" click and game creation, (2) timer state management in `online-game-state.svelte.ts` with host-authoritative countdown, (3) new protocol messages for timer configuration and sync, and (4) TurnIndicator modifications for countdown display and warning styling.

The core challenge is timer synchronization between peers. Since the game already uses a host-authoritative model (host validates all moves and broadcasts state), the timer should follow the same pattern: host runs the authoritative timer and periodically syncs remaining time to the guest. The guest runs a local display timer for smooth countdown but corrects drift from host sync messages.

**Primary recommendation:** Host owns the timer via `setInterval`. Send timer-sync messages every ~5 seconds (or on significant events like placement). Guest interpolates locally between syncs. Timer expiry is a host-side event that triggers a turn-advance broadcast.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Timer countdown integrated into the existing turn indicator pill (not a separate element)
- **D-02:** Turn indicator wording changed from "X -- 1 of 2" to "X -- 2 remaining" (clearer phrasing)
- **D-03:** When timer is active, format becomes "X -- 2 remaining -- 0:23"
- **D-04:** Timer text turns warning/red color when 10 seconds or less remain
- **D-05:** Host selects timer before creating the game (after clicking "Online Game", before the game is created and waiting screen shows)
- **D-06:** Segmented buttons: 30s | 60s | infinity -- one selected at a time
- **D-07:** Default selection is 60 seconds
- **D-08:** Brief warning (~1 second) before forfeiting -- timer hits 0:00, screen shakes, then turn passes
- **D-09:** Timer turns red at 0:00 and the screen/board shakes to signal the forfeit
- **D-10:** After the shake, remaining placements are skipped and turn passes to opponent

### Claude's Discretion
- Timer sync mechanism between host and guest (wall-clock vs relative)
- Whether timer resets per-placement or per-turn (per-turn is the expected behavior)
- Exact shake animation (CSS transform, duration, intensity)
- Whether to show timer in local games or online only
- Timer selector exact styling and positioning (before game creation overlay)
- How "unlimited" is displayed in the turn indicator (hidden timer, or show infinity)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NET-07 | Host can set turn timer before game starts (30s, 60s, or unlimited) | Timer selection UI (D-05, D-06, D-07), timer config in protocol, pre-game flow in App.svelte |
| NET-08 | Timer countdown visible to both players during timed games | Host-authoritative timer with sync messages, TurnIndicator modifications (D-01, D-03, D-04), guest local interpolation |
| NET-09 | Turn automatically forfeits remaining placements when timer expires | New `forfeitTurn` function in rules.ts, host-side expiry handler, shake animation (D-08, D-09, D-10) |
</phase_requirements>

## Standard Stack

### Core
No new libraries needed. This phase uses only existing project dependencies.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte 5 | 5.54.x | Reactive timer state via `$state`/`$derived`/`$effect` | Already in project. `$state` for countdown value, `$derived` for warning threshold, `$effect` for interval lifecycle. |
| Native `setInterval` | N/A | Timer tick mechanism | Standard browser API. 1-second interval for countdown display. No library needed. |
| CSS `@keyframes` | N/A | Screen shake animation on timer expiry | Native CSS animations. No animation library needed for a simple shake. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `setInterval` for ticks | `requestAnimationFrame` | RAF is smoother but fires at 60fps -- massive overkill for a 1-second countdown. `setInterval(1000)` is correct. |
| CSS shake animation | Canvas shake (translating the canvas) | CSS transform on the game container is simpler, affects all UI, and doesn't require render pipeline changes. Canvas-level shake would only affect the board. CSS is correct per D-09 "screen/board shakes." |
| Host-authoritative timer | Independent timers on each peer | Independent timers drift. Host-authoritative matches existing game architecture. |

## Architecture Patterns

### Recommended Changes to Project Structure
```
src/
  lib/
    game/
      rules.ts          # ADD: forfeitTurn() function
      timer.ts           # NEW: timer logic (createTimer, TimerConfig type)
    network/
      protocol.ts        # MODIFY: add timer message types
    state/
      online-game-state.svelte.ts  # MODIFY: integrate timer management
  components/
    TurnIndicator.svelte    # MODIFY: countdown display, warning color, wording change
    TimerSelector.svelte    # NEW: pre-game timer selection (segmented buttons)
    App.svelte              # MODIFY: pre-game flow, shake animation, timer prop threading
```

### Pattern 1: Host-Authoritative Timer
**What:** Host runs the countdown via `setInterval`. On each tick, host updates local state. Every ~5 seconds (or on turn change / placement), host sends a `timer-sync` message with remaining seconds. Guest displays a locally-ticking countdown but resets to host value on sync.
**When to use:** Always for online timed games.
**Why:** Matches the existing host-authoritative model. Prevents guest-side timer manipulation. Single source of truth for expiry events.

```typescript
// Timer state shape
interface TimerConfig {
  mode: 30 | 60 | 0;  // 0 = unlimited
}

interface TimerState {
  remaining: number;   // seconds remaining (whole numbers for display)
  running: boolean;
  warning: boolean;    // true when <= 10s
  expired: boolean;    // true when hit 0
}
```

### Pattern 2: Timer as Part of Game Flow (Not Snapshot)
**What:** Timer state is separate from `GameSnapshot`. The snapshot remains a pure game-state object (board, turns, status). Timer is a transient runtime concern managed by the online game state layer.
**When to use:** Always.
**Why:** Timer is not part of the game's logical state -- it's a timing constraint on the current turn. Keeping it out of `GameSnapshot` means: (a) local games don't need timer fields, (b) serialization/deserialization stays simple, (c) `rules.ts` remains pure and testable.

```typescript
// In online-game-state.svelte.ts
let timerRemaining = $state(0);
let timerWarning = $derived(timerRemaining <= 10 && timerRemaining > 0);
let timerExpired = $state(false);
```

### Pattern 3: Pre-Game Configuration Flow
**What:** Insert a timer selection step between "Online Game" button click and game creation. This is a new overlay/view state, not a modification to WaitingOverlay.
**When to use:** When host clicks "Online Game".
**Why:** D-05 specifies timer selection happens before game creation. The flow becomes: Landing -> TimerSelector -> createOnlineGameState(config) -> WaitingOverlay.

App.svelte flow change:
```
Current:  "Online Game" click -> startOnlineGame() -> WaitingOverlay
New:      "Online Game" click -> TimerSelector overlay -> startOnlineGame(timerConfig) -> WaitingOverlay
```

### Pattern 4: Turn Forfeiture as Pure Function
**What:** Add a `forfeitTurn` function to `rules.ts` that advances the turn without placing stones.
**When to use:** When timer expires on host side.
**Why:** Keeps game logic pure and testable. The online state layer calls `forfeitTurn(snapshot)` on expiry, same pattern as `applyMove`.

```typescript
// In rules.ts
export function forfeitTurn(snapshot: GameSnapshot): GameSnapshot {
  return {
    ...snapshot,
    placementsThisTurn: 0,
    isFirstTurn: false,
    currentPlayer: snapshot.currentPlayer === 'X' ? 'O' : 'X',
  };
}
```

### Pattern 5: Shake Animation via CSS
**What:** Apply a CSS class to the game container that triggers a `@keyframes` shake animation. Remove the class after animation completes.
**When to use:** On timer expiry (D-08, D-09).

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.shake {
  animation: shake 0.4s ease-in-out;
}
```

### Anti-Patterns to Avoid
- **Storing timer in GameSnapshot:** Timer is transient runtime state, not game logic. Don't pollute the snapshot.
- **Guest-authoritative timer:** Guest should never decide when time expires. Host decides, broadcasts.
- **Continuous timer sync (every tick):** Sending a message every second wastes bandwidth. Sync every 5s + on events.
- **Using `Date.now()` for display:** Wall-clock differences between peers cause visual disagreement. Use relative countdown from last sync point.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shake animation | JavaScript-driven transform loop | CSS `@keyframes` + class toggle | Browser-optimized, no JS overhead, automatically cleans up |
| Timer display formatting | Custom minutes:seconds math | Simple `Math.floor(s/60)` + pad | Trivial -- no library needed, but don't overthink it |

**Key insight:** This phase is entirely implementable with existing project dependencies. No new packages needed.

## Common Pitfalls

### Pitfall 1: Timer Drift Between Peers
**What goes wrong:** Host and guest timers show different values, especially after tab backgrounding or network latency.
**Why it happens:** `setInterval` is not guaranteed to fire exactly on time. Browsers throttle intervals in background tabs.
**How to avoid:** Host sends periodic sync messages. Guest resets its display timer to host's value on each sync. On turn change, both reset to full duration (host broadcasts this).
**Warning signs:** Timer values diverge by more than 1-2 seconds between peers.

### Pitfall 2: Timer Continues After Game Over
**What goes wrong:** Timer keeps ticking (and potentially forfeits) after a win has been detected.
**Why it happens:** Timer interval not cleared when game status changes to 'won'.
**How to avoid:** Check `snapshot.status` before processing timer expiry. Clear interval on game-over. Add guard in tick handler: `if (snapshot.status !== 'playing') return;`
**Warning signs:** Console errors or state mutations after game ends.

### Pitfall 3: Stale Interval on Rematch
**What goes wrong:** Old timer interval from previous game fires after rematch starts.
**Why it happens:** `setInterval` reference not cleared in rematch handler.
**How to avoid:** Clear any running timer interval in the rematch flow before starting a new game. Store interval ID and `clearInterval` on rematch.
**Warning signs:** Timer immediately shows wrong value or expires instantly on rematch.

### Pitfall 4: Tab Backgrounding Breaks Timer
**What goes wrong:** Browser throttles `setInterval` to 1/second or slower when tab is in background. Timer display freezes or jumps.
**Why it happens:** Browser power-saving behavior throttles background tabs.
**How to avoid:** On each tick, compute elapsed time from `Date.now()` rather than decrementing by 1. Store the timestamp when the timer started, derive remaining from `startTime + duration - now`. This self-corrects after tab refocus.
**Warning signs:** Timer jumps from 25 to 10 when user returns to tab.

### Pitfall 5: Multiple Placements Reset Timer
**What goes wrong:** Timer resets after first placement in a 2-placement turn, giving the player double time.
**Why it happens:** Timer reset logic tied to placement events instead of turn changes.
**How to avoid:** Timer resets only on turn change (when `currentPlayer` changes), not on individual placements. Per CONTEXT.md: timer is per-turn, not per-placement.
**Warning signs:** Players get 60s for each of their 2 placements instead of 60s total.

### Pitfall 6: Race Condition -- Move Arrives During Expiry
**What goes wrong:** Guest sends a valid move just as host's timer expires. Host processes the expiry and the move, causing double turn advancement.
**Why it happens:** Timer expiry and network message processing are asynchronous.
**How to avoid:** On timer expiry, immediately mark the timer as expired and process the forfeit. If a move arrives after expiry for the now-past turn, reject it (the snapshot's currentPlayer has already changed).
**Warning signs:** Turn counter jumps, wrong player is active.

## Code Examples

### Timer Tick with Self-Correcting Elapsed Time
```typescript
// Robust timer that handles tab backgrounding
function startTimer(durationSeconds: number, onTick: (remaining: number) => void, onExpire: () => void) {
  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;

  const interval = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    onTick(remaining);
    if (remaining <= 0) {
      clearInterval(interval);
      onExpire();
    }
  }, 200); // Tick at 200ms for smoother updates, display rounds to seconds

  return () => clearInterval(interval);
}
```

### Protocol Message Types for Timer
```typescript
// Add to GameMessage union in protocol.ts
| { type: 'timer-config'; mode: 30 | 60 | 0 }
| { type: 'timer-sync'; remaining: number }
| { type: 'timer-expired' }
```

### TurnIndicator Updated Display
```svelte
<!-- Format: "X -- 2 remaining -- 0:23" -->
<span class="player-letter" style:color={playerColor}>{currentPlayer}</span>
 -- {maxPlacements - placementsThisTurn} remaining
{#if timerActive}
  <span class="timer" class:warning={timerWarning}> -- {formatTime(timerRemaining)}</span>
{/if}
```

### Timer Formatting
```typescript
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
```

### Segmented Button Component Pattern
```svelte
<!-- TimerSelector.svelte -->
<script lang="ts">
  let { onSelect }: { onSelect: (mode: 30 | 60 | 0) => void } = $props();
  let selected = $state<30 | 60 | 0>(60); // Default per D-07
</script>

<div class="timer-selector">
  <div class="segment-group">
    {#each [30, 60, 0] as mode}
      <button
        class="segment"
        class:active={selected === mode}
        onclick={() => { selected = mode; }}
      >
        {mode === 0 ? '\u221e' : `${mode}s`}
      </button>
    {/each}
  </div>
  <button class="start-button" onclick={() => onSelect(selected)}>Create Game</button>
</div>
```

### CSS Shake Animation
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 50%, 90% { transform: translateX(-3px); }
  30%, 70% { transform: translateX(3px); }
}

.game-container.shake {
  animation: shake 0.4s ease-in-out;
}
```

## State of the Art

No technology changes relevant to this phase. All patterns use stable browser APIs (`setInterval`, CSS animations, WebRTC data channels via PeerJS).

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | N/A | N/A | N/A |

## Discretion Recommendations

Based on research, here are recommendations for areas marked as Claude's Discretion:

| Area | Recommendation | Rationale |
|------|----------------|-----------|
| Timer sync mechanism | Relative countdown from host with periodic sync (every 5s) | Wall-clock sync requires NTP-like negotiation. Relative countdown is simpler and sufficient. |
| Timer resets per-placement or per-turn | **Per-turn.** Timer resets when `currentPlayer` changes. | Matches user expectation from CONTEXT.md. Per-placement would double the effective time. |
| Shake animation | CSS `@keyframes`, 0.4s duration, 3-4px horizontal displacement | Brief, noticeable, not nauseating. Similar to form validation shakes. |
| Timer in local games | **Online only.** Local games have no timer. | Timer is a network feature (NET-07/08/09). Local play is casual, no time pressure needed. |
| Timer selector styling | Overlay with segmented buttons, styled like LandingPage buttons but as a horizontal group | Consistent with existing overlay pattern (LandingPage, WaitingOverlay). |
| "Unlimited" display in turn indicator | **Hide timer entirely.** Show only "X -- 2 remaining" with no time. | Showing infinity symbol adds clutter. If there's no timer, don't show timer UI. |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NET-07 | Timer config types and defaults | unit | `npx vitest run src/lib/game/timer.test.ts -x` | No - Wave 0 |
| NET-09 | forfeitTurn advances turn correctly | unit | `npx vitest run src/lib/game/rules.test.ts -x` | Yes (extend) |
| NET-08 | Timer formatting (m:ss) | unit | `npx vitest run src/lib/game/timer.test.ts -x` | No - Wave 0 |
| NET-09 | Timer expiry triggers forfeit (integration) | manual-only | Manual: start timed game, let timer expire, verify turn passes | N/A |
| NET-08 | Timer sync between peers | manual-only | Manual: open two browsers, verify countdown matches within 1-2s | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/game/timer.test.ts` -- covers timer formatting, timer config defaults, timer tick logic
- [ ] Extend `src/lib/game/rules.test.ts` -- add tests for `forfeitTurn` function

## Open Questions

1. **Timer config persistence across rematches**
   - What we know: Rematch resets the board via `applyRematch()`. Timer config is set pre-game.
   - What's unclear: Should the same timer config carry over on rematch, or should host re-select?
   - Recommendation: Carry over the same timer config. Re-selecting would break the fast rematch flow. Timer config is set once per session.

2. **Timer behavior during first turn (1 placement)**
   - What we know: First turn has only 1 placement. Timer durations (30s, 60s) are designed for 2-placement turns.
   - What's unclear: Should first turn use the same duration or a shorter one?
   - Recommendation: Same duration. Simpler, and the first placement is often the longest decision anyway.

## Sources

### Primary (HIGH confidence)
- Project codebase -- `src/lib/state/online-game-state.svelte.ts`, `src/lib/game/rules.ts`, `src/lib/network/protocol.ts`, `src/components/TurnIndicator.svelte` (read directly)
- CONTEXT.md (05-CONTEXT.md) -- user decisions D-01 through D-10

### Secondary (MEDIUM confidence)
- MDN Web Docs: `setInterval` behavior in background tabs -- browsers throttle to minimum 1s intervals
- CSS `@keyframes` animation -- standard, well-supported across all modern browsers

### Tertiary (LOW confidence)
- None -- this phase uses only standard browser APIs with no external library research needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, all existing patterns
- Architecture: HIGH - follows established host-authoritative model, extends existing state management
- Pitfalls: HIGH - timer synchronization is a well-understood problem domain; pitfalls are based on concrete code analysis of the existing state management
- UI patterns: HIGH - segmented buttons and countdown displays are straightforward

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- no fast-moving dependencies)
