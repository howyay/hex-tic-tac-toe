<script lang="ts">
  import type { Theme } from '../lib/theme/theme-state.svelte';

  let { theme, onToggle }: { theme: Theme; onToggle: () => void } = $props();
</script>

<button
  class="theme-toggle"
  onclick={onToggle}
  aria-label="Toggle theme"
>
  {#if theme === 'dark'}
    <!-- Moon icon -->
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M6 0a6 6 0 0 0 0 12 8 8 0 0 1-6-6 6 6 0 0 1 6-6z" transform="translate(3, 2)" />
    </svg>
  {:else}
    <!-- Sun icon -->
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="8" cy="8" r="3" />
      <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <line x1="8" y1="1" x2="8" y2="3" />
        <line x1="8" y1="13" x2="8" y2="15" />
        <line x1="1" y1="8" x2="3" y2="8" />
        <line x1="13" y1="8" x2="15" y2="8" />
        <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" />
        <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" />
        <line x1="3.05" y1="12.95" x2="4.46" y2="11.54" />
        <line x1="11.54" y1="4.46" x2="12.95" y2="3.05" />
      </g>
    </svg>
  {/if}
</button>

<style>
  .theme-toggle {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
    min-width: 44px;
    min-height: 44px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    pointer-events: auto;
    padding: 0;
    transition: color 0.15s ease;
  }

  .theme-toggle:hover {
    color: var(--color-text);
  }
</style>
