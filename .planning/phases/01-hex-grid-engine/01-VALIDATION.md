---
phase: 1
slug: hex-grid-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | GRID-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | GRID-02 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | GRID-03 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | GRID-04 | manual | browser test | ❌ | ⬜ pending |
| 01-02-03 | 02 | 1 | GRID-05 | manual | browser test | ❌ | ⬜ pending |
| 01-02-04 | 02 | 1 | GRID-06 | manual | browser test | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` — install test framework
- [ ] `src/lib/__tests__/hex-math.test.ts` — stubs for GRID-01, GRID-02 (axial coord math)
- [ ] `src/lib/__tests__/viewport.test.ts` — stubs for GRID-03 (viewport culling)

*Note: GRID-04 (pan), GRID-05 (zoom), GRID-06 (hover) require canvas interaction — manual verification in browser.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pan navigation | GRID-04 | Requires mouse interaction with canvas | Click-drag in browser, verify smooth pan with no boundaries |
| Zoom in/out | GRID-05 | Requires scroll wheel + canvas transform | Scroll wheel in browser, verify zoom anchors to cursor |
| Hover preview | GRID-06 | Requires mouse hover on canvas element | Hover over hexes, verify highlight appears under cursor |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
