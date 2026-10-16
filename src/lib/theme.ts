export type Theme = 'light' | 'dark';
export const THEME_KEY = 'maitu-theme';

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
