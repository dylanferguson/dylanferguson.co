import {
  setPreference,
  toggleAppearance,
  type AppearancePreference,
} from "./appearance";

export type Command = {
  id: string;
  title: string;
  keywords: readonly string[];
  shortcut?: string;
  run: () => void;
};

function setMode(preference: AppearancePreference): Command["run"] {
  return () => {
    setPreference(preference);
  };
}

export const siteCommands: readonly Command[] = [
  {
    id: "toggle-appearance",
    title: "Toggle Light/Dark Mode",
    keywords: ["theme", "appearance", "colour", "color", "night"],
    run: () => {
      toggleAppearance();
    },
  },
  {
    id: "use-light",
    title: "Use Light Mode",
    keywords: ["theme", "appearance", "day"],
    run: setMode("light"),
  },
  {
    id: "use-dark",
    title: "Use Dark Mode",
    keywords: ["theme", "appearance", "night"],
    run: setMode("dark"),
  },
  {
    id: "use-system",
    title: "Use System Appearance",
    keywords: ["theme", "os", "auto", "reset"],
    run: setMode("system"),
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
