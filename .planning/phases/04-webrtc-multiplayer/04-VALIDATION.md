---
phase: 4
slug: webrtc-multiplayer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (exists from Phase 1) |
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
| 04-01-01 | 01 | 1 | NET-03, NET-04 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | NET-05 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | NET-01, NET-02 | manual | browser test (2 tabs) | ❌ | ⬜ pending |
| 04-02-02 | 02 | 2 | NET-04, NET-06 | manual | browser test (2 tabs) | ❌ | ⬜ pending |
| 04-03-01 | 03 | 3 | NET-01..06 | manual | browser test (2 devices) | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/network/__tests__/messages.test.ts` — stubs for message serialization (Map to JSON roundtrip)
- [ ] `src/lib/network/__tests__/protocol.test.ts` — stubs for host validation logic

*Note: vitest already installed. No new infrastructure needed beyond peerjs and nanoid packages.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Host creates game + shareable link | NET-01 | Requires PeerJS Cloud signaling | Click Online Game, verify link appears with game ID |
| Guest joins via link | NET-02 | Requires two browser tabs/devices | Open link in 2nd tab, click Join, verify connection |
| Moves sync between peers | NET-04 | Requires live WebRTC connection | Place stone on one side, verify it appears on other |
| Host validates moves | NET-05 | Requires tampered client scenario | Verify invalid moves are rejected by host |
| Connection status indicator | NET-06 | Requires connection/disconnection | Connect, verify green; close one tab, verify red on other |
| Complete game over network | NET-01..06 | End-to-end integration | Play full game across 2 browsers through win + rematch |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
