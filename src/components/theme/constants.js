export const DEFAULT_THEME = "dark";
export const THEME_STORAGE_KEY = "h2-dashboard-ui-theme";
export const THEMES = ["dark", "light"];

export function isTheme(value) {
   return THEMES.includes(value);
}
