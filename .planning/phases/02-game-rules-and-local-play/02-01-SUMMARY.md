---
phase: 02-game-rules-and-local-play
plan: 01
subsystem: game-logic
tags: [connect6, hex-grid, win-detection, turn-management, tdd, pure-functions]

requires:
  - phase: 01-hex-grid-engine
    provides: HEX_DIRECTIONS, HexCoord type, hexRound normalization

provides:
  - Pure game rules engine (coordKey, createInitialSnapshot, isValidMove, checkWinFromHex, applyMove, applyRematch)
  - Game types (Player, GameStatus, GameSnapshot) in hex/types.ts
  - 18 unit tests covering all game rule requirements

affects: [02-game-rules-and-local-play, 03-webrtc-multiplayer]

tech-stack:
  added: []
  patterns: [immutable-snapshot-pattern, axis-pair-win-detection]

key-files:
  created:
    - src/lib/game/rules.ts
    - src/lib/game/rules.test.ts
  modified:
    - src/lib/hex/types.ts

key-decisions:
  - "Immutable snapshot pattern: applyMove returns new GameSnapshot, never mutates"
  - "Win detection checks from last-placed stone outward along 3 axis pairs using HEX_DIRECTIONS[0,3],[1,4],[2,5]"
  - "coordKey uses template literal for Map keys, relying on hexRound -0 normalization from Phase 1"

patterns-established:
  - "Immutable game state: all rule functions are pure, returning new snapshots"
  - "Axis-pair traversal: countInDirection helper walks both directions of an axis from a placed stone"

requirements-completed: [GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-08, GAME-09, UI-03]

duration: 4min
completed: 2026-03-22
---

# Phase 02 Plan 01: Game Rules Engine Summary

**Pure-function hex Connect6 rules engine with TDD: turn management (1-2-2-2), 3-axis win detection, immediate mid-turn game end, and loser-goes-first rematch**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T08:01:54Z
- **Completed:** 2026-03-22T08:05:39Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Complete game rules engine as pure functions with zero external dependencies
- Win detection algorithm checking all 3 hex axes (q, r, s) from each placed stone
- 18 unit tests covering turn management, win detection on all axes, mid-turn win, rematch logic, and edge cases
- Immutable snapshot pattern: every applyMove returns a new GameSnapshot

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests** - `6950f8e` (test)
2. **Task 1 (GREEN): Implementation passing all tests** - `01d995c` (feat)

_TDD task: RED commit (failing tests) followed by GREEN commit (implementation)._

## Files Created/Modified

- `src/lib/hex/types.ts` - Extended with Player, GameStatus, GameSnapshot types
- `src/lib/game/rules.ts` - Pure game logic: coordKey, createInitialSnapshot, isValidMove, checkWinFromHex, applyMove, applyRematch
- `src/lib/game/rules.test.ts` - 18 unit tests covering GAME-01 through GAME-05, GAME-08, GAME-09, UI-03, plus edge cases

## Decisions Made

- Immutable snapshot pattern chosen over mutable state for testability and future Svelte 5 reactivity compatibility (new Map on each move)
- Win detection uses countInDirection helper to walk axis pairs, O(6*max_line) per check from last-placed stone
- Test scenarios use deliberately scattered O positions to avoid accidental O wins on other axes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test scenarios with accidentally aligned O stones**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Test O stones at (-5,5), (-6,6), ..., (-10,10) formed 6 consecutive along r-axis, causing O to win before X could complete the q-axis line
- **Fix:** Scattered O positions to non-aligned coordinates (e.g., (-5,3), (-7,1), (-3,5), etc.)
- **Files modified:** src/lib/game/rules.test.ts
- **Verification:** All 18 tests pass

---

**Total deviations:** 1 auto-fixed (1 bug in test data)
**Impact on plan:** Minor test data correction. No scope change.

## Issues Encountered

None beyond the test data alignment issue documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Game rules engine ready for Plan 02 (reactive state wrapper) and Plan 03 (canvas rendering integration)
- Types exported from hex/types.ts for import by game-state.svelte.ts and renderer extensions
- All 49 tests across the project pass (18 new + 31 existing)

---
*Phase: 02-game-rules-and-local-play*
*Completed: 2026-03-22*
