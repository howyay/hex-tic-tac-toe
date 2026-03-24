# Phase 5: Turn Timer - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a configurable turn timer to online games. Host selects timer before game creation (30s, 60s, unlimited). Both players see a synchronized countdown. When time expires, remaining placements are forfeited and the turn passes. Requirements: NET-07, NET-08, NET-09.

</domain>

<decisions>
## Implementation Decisions

### Timer display
- **D-01:** Timer countdown integrated into the existing turn indicator pill (not a separate element)
- **D-02:** Turn indicator wording changed from "X — 1 of 2" to "X — 2 remaining" (clearer phrasing)
- **D-03:** When timer is active, format becomes "X — 2 remaining — 0:23"
- **D-04:** Timer text turns warning/red color when 10 seconds or less remain

### Timer selection UI
- **D-05:** Host selects timer before creating the game (after clicking "Online Game", before the game is created and waiting screen shows)
- **D-06:** Segmented buttons: 30s | 60s | ∞ — one selected at a time
- **D-07:** Default selection is 60 seconds

### Expiry behavior
- **D-08:** Brief warning (~1 second) before forfeiting — timer hits 0:00, screen shakes, then turn passes
- **D-09:** Timer turns red at 0:00 and the screen/board shakes to signal the forfeit
- **D-10:** After the shake, remaining placements are skipped and turn passes to opponent

### Claude's Discretion
- Timer sync mechanism between host and guest (wall-clock vs relative)
- Whether timer resets per-placement or per-turn (per-turn is the expected behavior)
- Exact shake animation (CSS transform, duration, intensity)
- Whether to show timer in local games or online only
- Timer selector exact styling and positioning (before game creation overlay)
- How "unlimited" is displayed in the turn indicator (hidden timer, or show ∞)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Game state (source of truth for turn management)
- `src/lib/game/rules.ts` — applyMove, turn management, placementsThisTurn, isFirstTurn
- `src/lib/hex/types.ts` — GameSnapshot type (may need timer fields)

### Network layer (timer must sync over this)
- `src/lib/network/protocol.ts` — GameMessage types (needs timer messages)
- `src/lib/state/online-game-state.svelte.ts` — host-authoritative game state

### UI components to modify
- `src/components/TurnIndicator.svelte` — currently "X — 1 of 2", needs timer + wording change
- `src/components/WaitingOverlay.svelte` — timer selector may go before this, or as a pre-game step
- `src/App.svelte` — view routing, timer setting flows through here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/TurnIndicator.svelte` — extend with countdown and wording change
- `src/lib/network/protocol.ts` — add timer-related message types (timer-start, timer-sync)
- `src/lib/state/online-game-state.svelte.ts` — host manages timer, sends sync to guest
- `src/lib/game/rules.ts` — pure functions; timer forfeit can call applyMove-like logic to advance turn

### Established Patterns
- Host-authoritative: host owns the timer, guest receives synced state
- Svelte 5 `$state`/`$derived` for reactive countdown
- `setInterval`/`setTimeout` for timer ticks (similar to rejection flash pattern)

### Integration Points
- TurnIndicator needs new props: `timerSeconds`, `timerActive`, `timerWarning`
- Online game state needs timer management (start, tick, expire, sync)
- Protocol needs new message types for timer configuration and sync
- App.svelte needs pre-game timer selection step between "Online Game" click and game creation
- The "2 remaining" wording change affects both local and online games (TurnIndicator is shared)

</code_context>

<specifics>
## Specific Ideas

- The screen shake on timer expiry should feel impactful but brief — like a "time's up" moment
- Timer integrated in the turn indicator keeps the UI minimal (no extra elements cluttering the board)
- "2 remaining" is clearer than "1 of 2" — applies to all game modes, not just timed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-turn-timer*
*Context gathered: 2026-03-23*
