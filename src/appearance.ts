export type Appearance = "light" | "dark";
export type AppearancePreference = Appearance | "system";

export const APPEARANCE_CHANGE_EVENT = "appearancechange";

const STORAGE_KEY = "appearance";
const THEME_DARK_CLASS = "theme-dark";
const THEME_LIGHT_CLASS = "theme-light";

export function parsePreference(raw: string | null): AppearancePreference {
  if (raw === "light" || raw === "dark") return raw;
  return "system";
}

export function resolveAppearance(
  preference: AppearancePreference,
  systemIsDark: boolean,
): Appearance {
  if (preference === "system") return systemIsDark ? "dark" : "light";
  return preference;
}

export function oppositeAppearance(appearance: Appearance): Appearance {
  return appearance === "dark" ? "light" : "dark";
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
  const appearance = resolveAppearance(preference, systemIsDark());
  const root = document.documentElement;
  root.classList.toggle(
    THEME_DARK_CLASS,
    preference !== "system" && appearance === "dark",
  );
  root.classList.toggle(
    THEME_LIGHT_CLASS,
    preference !== "system" && appearance === "light",
  );
  document.dispatchEvent(
    new CustomEvent(APPEARANCE_CHANGE_EVENT, { detail: { appearance } }),
  );
  return appearance;
}

export function isDarkAppearance(): boolean {
  const root = document.documentElement;
  if (root.classList.contains(THEME_LIGHT_CLASS)) return false;
  if (root.classList.contains(THEME_DARK_CLASS)) return true;
  return systemIsDark();
}

export function setPreference(preference: AppearancePreference): Appearance {
  writePreference(preference);
  return applyPreference(preference);
}

export function toggleAppearance(): Appearance {
  const current = resolveAppearance(readPreference(), systemIsDark());
  return setPreference(oppositeAppearance(current));
}

export function startAppearance(): void {
  applyPreference(readPreference());
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (readPreference() === "system") applyPreference("system");
    });
}

/* Blocking <head> copy of applyPreference. System leaves both classes
   off so `light-dark()` follows the OS. Forced light or dark sets one
   class, which only changes `color-scheme`. */
export const appearanceInitScript = `(function(){var stored=null;try{stored=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})}catch(e){}var preference=stored==="light"||stored==="dark"?stored:"system";if(preference==="system")return;var root=document.documentElement;root.classList.toggle(${JSON.stringify(THEME_DARK_CLASS)},preference==="dark");root.classList.toggle(${JSON.stringify(THEME_LIGHT_CLASS)},preference==="light")})();`;
