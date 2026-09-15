import { currentTheme } from "./themes";

type Appearance = "light" | "dark";
export type AppearancePreference = Appearance | "system";

export const APPEARANCE_CHANGE_EVENT = "appearancechange";

const STORAGE_KEY = "appearance";
const THEME_DARK_CLASS = "theme-dark";
const THEME_LIGHT_CLASS = "theme-light";

function parsePreference(raw: string | null): AppearancePreference {
  if (raw === "light" || raw === "dark") return raw;
  return "system";
}

function resolveAppearance(
  preference: AppearancePreference,
  systemIsDark: boolean,
): Appearance {
  if (preference === "system") return systemIsDark ? "dark" : "light";
  return preference;
}

function systemIsDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readPreference(): AppearancePreference {
  try {
    return parsePreference(localStorage.getItem(STORAGE_KEY));
  } catch {
    return "system";
  }
}

function writePreference(preference: AppearancePreference): void {
  try {
    if (preference === "system") {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Private mode can block storage. The session still applies.
  }
}

function applyPreference(preference: AppearancePreference): Appearance {
  const appearance =
    currentTheme().colorScheme ?? resolveAppearance(preference, systemIsDark());
  const root = document.documentElement;
  root.classList.toggle(THEME_DARK_CLASS, preference === "dark");
  root.classList.toggle(THEME_LIGHT_CLASS, preference === "light");
  document.dispatchEvent(
    new CustomEvent(APPEARANCE_CHANGE_EVENT, { detail: { appearance } }),
  );
  return appearance;
}

function currentPreference(): AppearancePreference {
  const root = document.documentElement;
  if (root.classList.contains(THEME_LIGHT_CLASS)) return "light";
  if (root.classList.contains(THEME_DARK_CLASS)) return "dark";
  return "system";
}

export function isDarkAppearance(): boolean {
  return (
    (currentTheme().colorScheme ??
      resolveAppearance(currentPreference(), systemIsDark())) === "dark"
  );
}

export function setPreference(preference: AppearancePreference): Appearance {
  writePreference(preference);
  return applyPreference(preference);
}

export function toggleAppearance(): Appearance {
  const preferenceIsDark =
    resolveAppearance(currentPreference(), systemIsDark()) === "dark";
  return setPreference(preferenceIsDark ? "light" : "dark");
}

export function startAppearance(): void {
  applyPreference(readPreference());
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (currentPreference() === "system") applyPreference("system");
    });
}

/* Blocking <head> copy of applyPreference. System leaves both classes
   off so `light-dark()` follows the OS. Forced light or dark sets one
   class, which only changes `color-scheme`. */
export const appearanceInitScript = `(function(){var stored=null;try{stored=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})}catch(e){}var preference=stored==="light"||stored==="dark"?stored:"system";if(preference==="system")return;var root=document.documentElement;root.classList.toggle(${JSON.stringify(THEME_DARK_CLASS)},preference==="dark");root.classList.toggle(${JSON.stringify(THEME_LIGHT_CLASS)},preference==="light")})();`;
