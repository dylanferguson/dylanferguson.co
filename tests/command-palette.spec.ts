import { expect, test } from "@playwright/test";

test("a delayed close event preserves a search entered after reopening", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator("astro-island:has(#command-palette)"),
  ).not.toHaveAttribute("ssr");
  await page.keyboard.press("ControlOrMeta+k");
  await page.evaluate(async () => {
    const trigger = document.querySelector<HTMLButtonElement>(
      "[data-command-palette-open]",
    )!;
    const search = document.querySelector<HTMLInputElement>(
      "#command-palette-input",
    )!;
    // Native dialog close events arrive after the synchronous interaction.
    trigger.click();
    trigger.click();
    search.value = "Toggle Light/Dark mode";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    for (let i = 0; i < 2; i++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    }
  });
  const search = page.getByRole("combobox", { name: "Search commands" });
  await expect(search).toHaveValue("Toggle Light/Dark mode");
  await search.press("Enter");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});

test("appearance stays selected when storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage is blocked", "SecurityError");
    };
  });
  await page.goto("/");
  await expect(
    page.locator("astro-island:has(#command-palette)"),
  ).not.toHaveAttribute("ssr");

  const trigger = page.getByRole("button", { name: "Open command palette" });
  const toggle = page.getByRole("option", { name: "Toggle Light/Dark mode" });
  await trigger.click();
  await toggle.click();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await trigger.click();
  await toggle.click();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");

  await page.emulateMedia({ colorScheme: "dark" });
  // Let the media change event run before checking the retained preference.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
});

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

  const selected = palette.getByRole("option", { selected: true });
  await expect(selected).toHaveText("Toggle Light/Dark mode");
  await search.press("ArrowDown");
  await expect(selected).not.toHaveText("Toggle Light/Dark mode");
  await search.press("ArrowUp");
  await expect(selected).toHaveText("Toggle Light/Dark mode");
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
    "Toggle Light/Dark mode",
  );
});
