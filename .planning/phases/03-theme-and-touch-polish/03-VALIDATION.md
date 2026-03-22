---
phase: 3
slug: theme-and-touch-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 3 — Validation Strategy

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
| 03-01-01 | 01 | 1 | UI-04, UI-05 | unit + manual | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | UI-08 | manual | browser test | ❌ | ⬜ pending |
| 03-02-01 | 02 | 2 | UI-06, UI-07 | manual | browser test (touch device) | ❌ | ⬜ pending |
| 03-02-02 | 02 | 2 | UI-06, UI-07 | manual | browser test (touch device) | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/render/__tests__/theme.test.ts` — stubs for theme color resolution and localStorage persistence

*Note: vitest already installed. No new infrastructure needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Light/dark toggle works visually | UI-04 | Canvas + DOM visual change | Toggle theme, verify all colors change (canvas background, grid, overlays, stones) |
| Theme persists across reload | UI-05 | localStorage + page reload | Set light theme, reload browser, verify light theme loads |
| Tap to place on touch device | UI-06 | Touch hardware required | Tap a hex on phone/tablet, verify stone places |
| Pinch to zoom on touch device | UI-07 | Touch hardware required | Pinch gesture on phone/tablet, verify smooth zoom |
| Drag to pan on touch device | UI-07 | Touch hardware required | Drag with one finger, verify pan without placing |
| Minimal clean aesthetic | UI-08 | Subjective visual quality | Review both themes for clutter, verify board + status only |
| No theme flash on load | N/A | Page load timing | Set light theme, hard refresh, verify no dark flash |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
