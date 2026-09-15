import { expect, test } from "@playwright/test";

test("keyboard commands change appearance and persist after reload", async ({
  page,
}) => {
  await page.goto("/");
  // The server-rendered trigger is interactive only after Svelte hydrates.
  await expect(
    page.locator("astro-island:has(#command-palette)"),
  ).not.toHaveAttribute("ssr");

  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  const search = page.getByRole("combobox", { name: "Search commands" });
  await expect(palette).toBeVisible();
  await expect(search).toBeFocused();

  await search.fill("use");
  await expect(palette.getByRole("option", { selected: true })).toHaveText(
    "Use Light Mode",
  );
  await search.press("ArrowDown");
  await expect(palette.getByRole("option", { selected: true })).toHaveText(
    "Use Dark Mode",
  );
  await search.press("Enter");
  await expect(palette).not.toBeVisible();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});

test("Escape restores trigger focus and reopening clears the search", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator("astro-island:has(#command-palette)"),
  ).not.toHaveAttribute("ssr");

  const trigger = page.getByRole("button", { name: "Open command palette" });
  const palette = page.getByRole("dialog", { name: "Command palette" });
  const search = page.getByRole("combobox", { name: "Search commands" });
  await trigger.click();
  await expect(search).toBeFocused();
  await search.fill("dark");
  await search.press("Escape");
  await expect(palette).not.toBeVisible();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
  await expect(palette.getByRole("option", { selected: true })).toHaveText(
    "Toggle Light/Dark Mode",
  );
});
