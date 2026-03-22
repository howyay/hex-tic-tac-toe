<script lang="ts">
  let { winner, onRematch }: { winner: 'X' | 'O'; onRematch: () => void } = $props();

  let visible = $state(false);
  $effect(() => {
    const timer = setTimeout(() => { visible = true; }, 500);
    return () => clearTimeout(timer);
  });
</script>

<div class="game-overlay" class:visible>
  <div class="content">
    <div class="winner-text">{winner} wins!</div>
    <button class="rematch-button" onclick={onRematch}>Rematch</button>
  </div>
</div>

<style>
  .game-overlay {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: rgba(0, 0, 0, 0.7);
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
    color: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .rematch-button {
    margin-top: 24px;
    font-size: 16px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
    background: #4fc3f7;
    color: #1a1a2e;
    border: none;
    border-radius: 4px;
    padding: 8px 24px;
    cursor: pointer;
  }
  .rematch-button:hover {
    background: #81d4fa;
  }
</style>
