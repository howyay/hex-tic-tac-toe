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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  {:else}
    <!-- Sun icon -->
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="6.76" y2="6.76" />
      <line x1="17.24" y1="17.24" x2="19.07" y2="19.07" />
      <line x1="4.93" y1="19.07" x2="6.76" y2="17.24" />
      <line x1="17.24" y1="6.76" x2="19.07" y2="4.93" />
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
    color: var(--color-text);
    pointer-events: auto;
    padding: 0;
    transition: color 0.15s ease;
  }

  .theme-toggle:hover {
    color: var(--color-text);
  }
</style>
