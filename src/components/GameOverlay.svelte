<script lang="ts">
  import type { HexCoord } from '../lib/hex/types';

  let { winner, onRematch, moveHistory = [] }: {
    winner: 'X' | 'O';
    onRematch: () => void;
    moveHistory?: { player: 'X' | 'O'; hex: HexCoord }[];
  } = $props();

  let visible = $state(false);
  let copied = $state(false);

  $effect(() => {
    const timer = setTimeout(() => { visible = true; }, 500);
    return () => clearTimeout(timer);
  });

  function formatMoveList(): string {
    return moveHistory.map((m, i) =>
      `${i + 1}. ${m.player} (${m.hex.q},${m.hex.r})`
    ).join('\n');
  }

  async function copyMoves() {
    const text = `Hex Connect6 — ${winner} wins!\n\n${formatMoveList()}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<div class="game-overlay" class:visible>
  <div class="content">
    <div class="winner-text">{winner} wins!</div>
    <button class="rematch-button" onclick={onRematch}>Rematch</button>
    {#if moveHistory.length > 0}
      <button class="copy-button" class:copied onclick={copyMoves}>
        {copied ? 'Copied!' : 'Copy Moves'}
      </button>
    {/if}
  </div>
</div>

<style>
  .game-overlay {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: var(--color-gameover-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 200ms ease;
    pointer-events: none;
  }
  .game-overlay.visible {
    opacity: 1;
    pointer-events: auto;
  }
  .winner-text {
    font-size: 28px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-text);
    font-family: system-ui, -apple-system, sans-serif;
  }
  .rematch-button {
    margin-top: 24px;
    font-size: 16px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--color-button-bg);
    color: var(--color-button-text);
    border: none;
    border-radius: 4px;
    padding: 8px 24px;
    cursor: pointer;
  }
  .rematch-button:hover {
    background: var(--color-button-hover);
  }

  .copy-button {
    margin-top: 8px;
    font-size: 14px;
    font-weight: 400;
    font-family: system-ui, -apple-system, sans-serif;
    color: var(--color-text-muted);
    text-decoration: underline;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
  }

  .copy-button.copied {
    color: var(--color-copy-success);
    text-decoration: none;
  }
</style>
