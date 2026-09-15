export const themes = [
  { id: "default", name: "Default", colorScheme: null, effects: true },
  {
    id: "cs-professor",
    name: "CS Professor Website",
    colorScheme: "light",
    effects: false,
  },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
export const THEME_CHANGE_EVENT = "themechange";
const STORAGE_KEY = "theme";

export function currentTheme() {
  return (
    themes.find(
      (theme) => theme.id === document.documentElement.dataset.theme,
    ) ?? themes[0]
  );
}

export function setTheme(id: ThemeId): void {
  const theme = themes.find((theme) => theme.id === id) ?? themes[0];
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  if (theme.colorScheme) root.dataset.themeColorScheme = theme.colorScheme;
  else delete root.dataset.themeColorScheme;

  try {
    if (theme.id === "default") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme.id);
  } catch {
    // Storage can be blocked; the current page still switches.
  }
  document.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
}

// Runs before styles load, using the same registry as the palette.
export const themeInitScript = `(function(){var themes=${JSON.stringify(themes)},stored=null;try{stored=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})}catch(e){}var theme=themes.find(function(theme){return theme.id===stored})||themes[0],root=document.documentElement;root.dataset.theme=theme.id;if(theme.colorScheme)root.dataset.themeColorScheme=theme.colorScheme;else delete root.dataset.themeColorScheme})();`;
