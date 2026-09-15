import { toggleAppearance } from "./appearance";
import { currentTheme, setTheme, themes } from "./themes";

export type Command = {
  id: string;
  title: string;
  keywords: readonly string[];
  available?: () => boolean;
  run: () => void;
};

export const siteCommands: readonly Command[] = [
  ...themes.map((theme) => ({
    id: `theme-${theme.id}`,
    title: `Theme: ${theme.name}`,
    keywords: ["theme", "style", "design"],
    run: () => setTheme(theme.id),
  })),
  {
    id: "toggle-appearance",
    title: "Toggle Light/Dark mode",
    available: () => currentTheme().colorScheme === null,
    keywords: ["theme", "appearance", "colour", "color", "night"],
    run: () => {
      toggleAppearance();
    },
  },
];

export function filterCommands(
  commands: readonly Command[],
  query: string,
): Command[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [...commands];
  return commands.filter((command) => {
    if (command.title.toLowerCase().includes(needle)) return true;
    return command.keywords.some((keyword) =>
      keyword.toLowerCase().includes(needle),
    );
  });
}
