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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  {:else}
    <!-- Sun icon -->
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="12" y1="1" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="23" />
        <line x1="1" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
        <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
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
