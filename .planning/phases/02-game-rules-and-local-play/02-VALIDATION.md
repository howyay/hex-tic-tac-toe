---
phase: 2
slug: game-rules-and-local-play
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (exists from Phase 1) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | GAME-01, GAME-02 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | GAME-03, GAME-04 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | GAME-05 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | GAME-06 | manual | browser test | ❌ | ⬜ pending |
| 02-02-02 | 02 | 2 | GAME-07, GAME-08, GAME-09 | manual | browser test | ❌ | ⬜ pending |
| 02-02-03 | 02 | 2 | UI-01, UI-02, UI-03 | manual | browser test | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/game/rules.test.ts` — stubs for GAME-01 through GAME-05 (turn rules, win detection on 3 axes, mid-turn win)

*Note: vitest already installed from Phase 1. No new infrastructure needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Win line glow highlight | GAME-06 | Canvas visual effect | Play to win, verify 6 stones glow/outline |
| Game over overlay | GAME-07 | DOM overlay on canvas | Win a game, verify "X wins!" overlay appears |
| Rematch flow | GAME-08, GAME-09 | Full game cycle | Win, click Rematch, verify loser goes first |
| Turn indicator display | UI-01, UI-02 | DOM text positioning | Play game, verify "X — 1 of 2" updates correctly |
| Move counter | UI-03 | DOM text display | Play several turns, verify counter increments |
| Occupied hex rejection | D-02 | Canvas interaction | Click occupied hex, verify visual rejection |
| Board freeze on win | D-06 | Canvas interaction | Win game, try to pan/zoom, verify frozen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
