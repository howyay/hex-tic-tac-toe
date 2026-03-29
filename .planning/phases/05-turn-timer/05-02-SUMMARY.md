---
phase: 05-turn-timer
plan: 02
subsystem: ui
tags: [svelte, webrtc, peerjs, timer, canvas, animation]

# Dependency graph
requires:
  - phase: 05-01
    provides: timer.ts types/utilities, forfeitTurn rule, protocol timer message types
  - phase: 04-online-multiplayer
    provides: online-game-state, PeerJS networking, protocol message infrastructure
provides:
  - TimerSelector pre-game UI (30s/60s/unlimited segmented buttons)
  - Host-authoritative countdown timer with guest sync via timer-config/timer-sync/timer-expired messages
  - TurnIndicator updated with countdown display and warning state (red when <= 10s)
  - Screen shake animation on timer expiry with auto-forfeit
  - Turn wording updated to "N remaining" across all game modes
affects: [future phases using TurnIndicator, any phase touching online-game-state]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Host-authoritative timer: host owns interval, guest does local display-only interpolation
    - timer-config sent on game-start, timer-sync every 5s + on turn change, timer-expired on expiry
    - Shake animation via CSS keyframes + class:shake conditional binding
    - timerSeconds=undefined hides timer in TurnIndicator (local games have no timer)

key-files:
  created:
    - src/components/TimerSelector.svelte
  modified:
    - src/components/TurnIndicator.svelte
    - src/lib/state/online-game-state.svelte.ts
    - src/App.svelte

key-decisions:
  - "Host-authoritative timer: host runs setInterval at 200ms, syncs to guest every 5s and on each turn change"
  - "Guest runs local display-only timer from timer-config/timer-sync anchors for smooth display without network jitter"
  - "timerSeconds prop is undefined (not 0) when no timer active, allowing TurnIndicator to cleanly hide countdown"
  - "online-setup view added to App.svelte AppView to route through TimerSelector before game creation"

patterns-established:
  - "Timer as transient state: timer vars live in online-game-state closure, not in GameSnapshot (timer resets on rematch via new session)"
  - "Auth-style pre-game overlay: TimerSelector uses same full-screen overlay pattern as LandingPage/WaitingOverlay"

requirements-completed: [NET-07, NET-08, NET-09]

# Metrics
duration: ~30min
completed: 2026-03-28
---

# Phase 05 Plan 02: Turn Timer Integration Summary

**Host-authoritative turn timer wired into online games: pre-game selection UI, synchronized countdown in TurnIndicator, auto-forfeit with screen shake on expiry**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-24T08:30:43Z
- **Completed:** 2026-03-28
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- TimerSelector component with segmented 30s/60s/infinity buttons shows before online game creation; 60s default
- Online game state now manages host-authoritative countdown with timer-config/timer-sync/timer-expired protocol messages keeping guest display in sync
- TurnIndicator updated: wording changed from "N of M" to "N remaining" in all modes; countdown appended for timed online games; text turns red at <= 10s warning threshold
- Screen shake animation on timer expiry; host forfeits remaining placements and sends state-update to advance turn
- One post-checkpoint fix (8ccb077): guest timer display initialization and erratic warning flash on first render

## Task Commits

Each task was committed atomically:

1. **Task 1: TimerSelector component and TurnIndicator update** - `e00a4ae` (feat)
2. **Task 2: Online game state timer integration and App.svelte wiring** - `a6af720` (feat)
3. **Task 3: Human-verify checkpoint** - approved by user
4. **Post-checkpoint fix: guest timer display and warning flash** - `8ccb077` (fix)

**Plan metadata:** (pending)

## Files Created/Modified
- `src/components/TimerSelector.svelte` - Pre-game timer selection overlay with segmented button group
- `src/components/TurnIndicator.svelte` - Added timerSeconds/timerWarning props, countdown display, warning color, "N remaining" wording
- `src/lib/state/online-game-state.svelte.ts` - Host timer management (setInterval, sync, forfeit), guest timer display, new API getters
- `src/App.svelte` - online-setup view, handleTimerSelect flow, shake animation CSS, timer prop threading to TurnIndicator

## Decisions Made
- Host runs a 200ms self-correcting interval (`Math.ceil((startedAt + duration*1000 - Date.now()) / 1000)`) to avoid drift
- Guest runs a local display-only interval anchored to timer-sync messages for smooth countdown without re-broadcasting
- `timerSeconds` prop is `undefined` (not `0`) when no timer active — clean sentinel that TurnIndicator uses to hide the countdown section entirely

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Guest timer display initialization and warning flash**
- **Found during:** Task 3 (human-verify checkpoint, post-approval fix)
- **Issue:** Guest timer was not initializing correctly on game-start; warning flash appeared briefly at turn start before timer had run down
- **Fix:** Corrected guest timer initialization on timer-config receipt; added guard to suppress warning at full duration
- **Files modified:** src/lib/state/online-game-state.svelte.ts
- **Verification:** TypeScript compiles; user confirmed correct behavior
- **Committed in:** 8ccb077

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required for correct guest experience. No scope creep.

## Issues Encountered
- Timer warning flash at turn start: caused by guest `timerWarning` being briefly true when `timerRemaining` initialized to 0 before first timer-config arrived. Fixed by initializing to the timer mode value.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 05 complete. All NET-07/08/09 requirements satisfied.
- Turn timer is fully playable: host configures, both players see synchronized countdown, expiry auto-forfeits the turn.
- No known blockers.

---
*Phase: 05-turn-timer*
*Completed: 2026-03-28*
