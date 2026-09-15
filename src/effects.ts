import { APPEARANCE_CHANGE_EVENT } from "./appearance";
import { currentTheme, THEME_CHANGE_EVENT } from "./themes";

export function effectsActive(): boolean {
  return !document.hidden && currentTheme().effects;
}

/* Runs `sync` now and whenever canvas effects may need to start, stop,
   or repaint. */
export function watchEffects(sync: () => void): void {
  for (const event of [
    "visibilitychange",
    THEME_CHANGE_EVENT,
    APPEARANCE_CHANGE_EVENT,
  ]) {
    document.addEventListener(event, sync);
  }
  sync();
}
