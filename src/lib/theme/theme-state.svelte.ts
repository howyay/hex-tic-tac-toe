export type Theme = 'dark' | 'light';

export function createThemeState() {
  const stored = localStorage.getItem('theme') as Theme | null;
  let theme = $state<Theme>(stored ?? 'dark');

  $effect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });

  return {
    get theme() { return theme; },
    toggle() { theme = theme === 'dark' ? 'light' : 'dark'; },
  };
}
