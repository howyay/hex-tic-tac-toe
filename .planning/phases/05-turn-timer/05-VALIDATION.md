---
phase: 5
slug: turn-timer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (exists) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | NET-07 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | NET-09 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | NET-07 | manual | browser test | ❌ | ⬜ pending |
| 05-02-02 | 02 | 2 | NET-08 | manual | browser test (2 tabs) | ❌ | ⬜ pending |
| 05-02-03 | 02 | 2 | NET-09 | manual | browser test (2 tabs) | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/game/rules.test.ts` — add stubs for forfeitTurn() function

*Note: vitest already installed. Existing test file extended.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Timer selector before game creation | NET-07 | UI flow | Click Online Game, verify 30s/60s/∞ selector appears |
| Synced countdown on both sides | NET-08 | Requires 2 browsers | Start timed game, verify both tabs show same countdown |
| Auto-forfeit on expiry | NET-09 | Requires timer to expire | Let timer run out, verify screen shake + turn passes |
| Warning color at 10s | D-04 | Visual | Watch countdown, verify red at ≤10s |
| Turn indicator wording | D-02 | Visual | Verify "X — 2 remaining" format |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
