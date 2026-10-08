export type Theme = 'light' | 'dark';
export const THEME_KEY = 'maitu-theme';

// Runs before paint, including cached/offline navigations. A saved choice overrides the OS.
export const themeScript = `(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    let saved;
    try { saved = localStorage.getItem('maitu-theme'); } catch {}
    const dark = saved === 'dark' || (saved !== 'light' && media.matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#171717' : '#f3f4f6');
    window.dispatchEvent(new Event('maitu-theme-change'));
  };
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => { if (event.key === 'maitu-theme' || event.key === null) apply(); });
})();`;

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* Apply the choice even when preference storage is unavailable. */
  }
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#171717' : '#f3f4f6');
  window.dispatchEvent(new Event('maitu-theme-change'));
}
