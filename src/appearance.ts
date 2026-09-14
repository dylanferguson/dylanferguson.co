export type Appearance = "light" | "dark";
export type AppearancePreference = Appearance | "system";

export const APPEARANCE_STORAGE_KEY = "appearance";
export const THEME_DARK_CLASS = "theme-dark";
export const THEME_LIGHT_CLASS = "theme-light";
export const APPEARANCE_CHANGE_EVENT = "appearancechange";

export function parsePreference(raw: string | null): AppearancePreference {
  if (raw === "light" || raw === "dark") return raw;
  return "system";
}

export function resolveAppearance(
  preference: AppearancePreference,
  systemDark: boolean,
): Appearance {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

export function oppositeAppearance(appearance: Appearance): Appearance {
  return appearance === "dark" ? "light" : "dark";
}

export function systemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readPreference(): AppearancePreference {
  try {
    return parsePreference(localStorage.getItem(APPEARANCE_STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function writePreference(preference: AppearancePreference): void {
  try {
    if (preference === "system") {
      localStorage.removeItem(APPEARANCE_STORAGE_KEY);
      return;
    }
    localStorage.setItem(APPEARANCE_STORAGE_KEY, preference);
  } catch {
    // Private mode can block storage. The session still applies.
  }
}

export function applyAppearance(appearance: Appearance): void {
  const root = document.documentElement;
  root.classList.toggle(THEME_DARK_CLASS, appearance === "dark");
  root.classList.toggle(THEME_LIGHT_CLASS, appearance === "light");
}

export function resolvedAppearance(): Appearance {
  return resolveAppearance(readPreference(), systemDark());
}

export function isDarkAppearance(): boolean {
  const root = document.documentElement;
  if (root.classList.contains(THEME_LIGHT_CLASS)) return false;
  if (root.classList.contains(THEME_DARK_CLASS)) return true;
  return systemDark();
}

function notify(appearance: Appearance): void {
  document.dispatchEvent(
    new CustomEvent(APPEARANCE_CHANGE_EVENT, { detail: { appearance } }),
  );
}

export function syncAppearance(): Appearance {
  const appearance = resolvedAppearance();
  applyAppearance(appearance);
  notify(appearance);
  return appearance;
}

export function setPreference(preference: AppearancePreference): Appearance {
  writePreference(preference);
  return syncAppearance();
}

export function toggleAppearance(): Appearance {
  return setPreference(oppositeAppearance(resolvedAppearance()));
}

export function startAppearance(): void {
  syncAppearance();
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (readPreference() === "system") syncAppearance();
    });
}

/* Blocking <head> copy of syncAppearance. Keep the names in step with
   the constants above; the generated string is the only way to paint
   before CSS from the media query would otherwise flash. */
export const appearanceInitScript = `(function(){var k=${JSON.stringify(APPEARANCE_STORAGE_KEY)};var d=${JSON.stringify(THEME_DARK_CLASS)};var l=${JSON.stringify(THEME_LIGHT_CLASS)};var s=null;try{s=localStorage.getItem(k)}catch(e){}var p=s==="light"||s==="dark"?s:"system";var sys=false;try{sys=matchMedia("(prefers-color-scheme: dark)").matches}catch(e){}var dark=p==="dark"||(p==="system"&&sys);var r=document.documentElement;r.classList.toggle(d,dark);r.classList.toggle(l,!dark)})();`;
