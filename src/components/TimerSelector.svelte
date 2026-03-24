<script lang="ts">
  import type { TimerMode } from '../lib/game/timer';
  import { DEFAULT_TIMER_MODE } from '../lib/game/timer';

  let { onSelect }: { onSelect: (mode: TimerMode) => void } = $props();

  let selected: TimerMode = $state(DEFAULT_TIMER_MODE);

  const options: readonly TimerMode[] = [30, 60, 0] as const;

  function label(mode: TimerMode): string {
    return mode === 0 ? '\u221E' : `${mode}s`;
  }

  function handleCreate() {
    onSelect(selected);
  }
</script>

<div class="setup-overlay">
  <div class="content">
    <h1 class="heading">Game Setup</h1>
    <label class="timer-label">Turn Timer</label>
    <div class="segmented-group">
      {#each options as mode, i}
        <button
          class="segment-button"
          class:active={selected === mode}
          class:first={i === 0}
          class:last={i === options.length - 1}
          onclick={() => selected = mode}
        >
          {label(mode)}
        </button>
      {/each}
    </div>
    <button class="cta-button" onclick={handleCreate}>Create Game</button>
  </div>
</div>

<style>
  .setup-overlay {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: var(--color-gameover-bg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    max-width: 400px;
    width: 100%;
    padding: 0 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .heading {
    font-size: 36px;
    font-weight: 600;
    line-height: 1.1;
    color: var(--color-text);
    font-family: system-ui, -apple-system, sans-serif;
    margin: 0 0 24px 0;
  }

  .timer-label {
    font-size: 16px;
    font-weight: 400;
    color: var(--color-text-muted);
    font-family: system-ui, -apple-system, sans-serif;
    margin: 0 0 12px 0;
  }

  .segmented-group {
    display: flex;
    flex-direction: row;
    border: 1px solid color-mix(in srgb, var(--color-text-muted) 30%, transparent);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 32px;
  }

  .segment-button {
    min-height: 44px;
    min-width: 64px;
    padding: 8px 16px;
    font-size: 16px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
    background: transparent;
    color: var(--color-text-muted);
    border: none;
    border-right: 1px solid color-mix(in srgb, var(--color-text-muted) 30%, transparent);
    border-radius: 0;
    cursor: pointer;
  }

  .segment-button.last {
    border-right: none;
  }

  .segment-button.first {
    border-radius: 4px 0 0 4px;
  }

  .segment-button.last {
    border-radius: 0 4px 4px 0;
  }

  .segment-button.active {
    background: var(--color-button-bg);
    color: var(--color-button-text);
  }

  .cta-button {
    width: 100%;
    min-height: 44px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--color-button-bg);
    color: var(--color-button-text);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .cta-button:hover {
    background: var(--color-button-hover);
  }
</style>
