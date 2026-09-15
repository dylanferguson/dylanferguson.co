import { expect, test, type Page } from "@playwright/test";

async function runCommand(page: Page, name: string) {
  await expect(
    page.locator("astro-island:has(#command-palette)"),
  ).not.toHaveAttribute("ssr");
  await page.keyboard.press("ControlOrMeta+k");
  const search = page.getByRole("combobox", { name: "Search commands" });
  await search.fill(name);
  await search.press("Enter");
  await expect(page.getByRole("dialog")).not.toBeVisible();
}

test("theme commands persist across navigation and restore dark appearance", async ({
  page,
}) => {
  await page.goto("/");
  await runCommand(page, "Toggle Light/Dark mode");
  await runCommand(page, "CS Professor Website");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await expect(page.locator("[data-orb]")).toBeHidden();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expect(
    page.getByRole("link", { name: "GitHub", exact: true }),
  ).toHaveCSS("color", "rgb(0, 0, 238)");

  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette.getByRole("option")).toHaveCount(2);
  const search = page.getByRole("combobox", { name: "Search commands" });
  await search.fill("dark");
  await expect(palette.getByRole("option")).toHaveCount(0);
  await expect(palette.getByText("No matching commands")).toBeVisible();
  await search.press("Enter");
  await expect(palette).toBeVisible();
  await search.press("Escape");

  await page.getByRole("link", { name: "Software canon", exact: true }).click();
  await page.reload();
  await expect(page.locator("body")).toHaveCSS(
    "font-family",
    '"Times New Roman", Times, serif',
  );
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await expect(
    page.locator("astro-island:has(#command-palette)"),
  ).not.toHaveAttribute("ssr");
  await page.keyboard.press("ControlOrMeta+k");
  await expect(palette.getByRole("option")).toHaveCount(2);
  await expect(
    palette.getByRole("option", { name: "Toggle Light/Dark mode" }),
  ).toHaveCount(0);
  await search.press("Escape");
  await runCommand(page, "Theme: Default");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await expect(page.locator("body")).not.toHaveCSS(
    "font-family",
    '"Times New Roman", Times, serif',
  );
  await runCommand(page, "Toggle Light/Dark mode");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
});

test("saved theme applies before hydration, with invalid values falling back", async ({
  page,
}) => {
  await page.route("**/*.js", (route) => route.abort());
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("theme", "cs-professor");
    localStorage.setItem("appearance", "dark");
  });
  await page.reload();
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator("[data-orb]")).toBeHidden();
  await page.evaluate(() => localStorage.setItem("theme", "removed-theme"));
  await page.reload();
  await expect(page.locator("[data-orb]")).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});

test("blocked storage still permits switching and retains system appearance", async ({
  page,
}) => {
  await page.addInitScript(() => {
    for (const method of ["getItem", "setItem", "removeItem"] as const) {
      Storage.prototype[method] = () => {
        throw new DOMException("Storage is blocked", "SecurityError");
      };
    }
  });
  await page.goto("/");
  await runCommand(page, "CS Professor Website");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await runCommand(page, "Theme: Default");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(0, 0, 0)",
  );
  await runCommand(page, "CS Professor Website");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  for (const path of ["/", "/404.html"]) {
    test(`canvas stops and resumes on ${path} with motion ${reducedMotion}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion });
      await page.addInitScript(() => {
        for (const method of ["clearRect", "fillRect"] as const) {
          const original = CanvasRenderingContext2D.prototype[method];
          CanvasRenderingContext2D.prototype[method] = function (...args) {
            this.canvas.dataset.paints = String(
              Number(this.canvas.dataset.paints ?? 0) + 1,
            );
            original.apply(this, args);
          };
        }
      });
      await page.goto(path);
      const canvas = page.locator("canvas");
      await expect
        .poll(() => canvas.getAttribute("data-paints"))
        .not.toBeNull();
      await runCommand(page, "CS Professor Website");
      const stopped = await canvas.getAttribute("data-paints");
      await page.evaluate(async () => {
        document.dispatchEvent(new Event("visibilitychange"));
        for (let i = 0; i < 5; i++) {
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
        }
      });
      expect(await canvas.getAttribute("data-paints")).toBe(stopped);
      await runCommand(page, "Theme: Default");
      await expect(canvas).toBeVisible();
      await expect
        .poll(() => canvas.getAttribute("data-paints"))
        .not.toBe(stopped);
    });
  }
}

for (const width of [375, 1280]) {
  test(`plain theme content and controls fit a ${width}px viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await runCommand(page, "CS Professor Website");
    const paths = [
      "/",
      "/software-canon/",
      "/personal-canon/",
      "/resume/",
      "/404.html",
    ];
    if (process.env.WRITINGS === "true")
      paths.push("/writings/", "/writings/hello-world/");
    for (const path of paths) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("h1")).toHaveCSS("font-weight", "700");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      const trigger = page.getByRole("button", {
        name: "Open command palette",
      });
      await expect(
        page.locator("astro-island:has(#command-palette)"),
      ).not.toHaveAttribute("ssr");
      await trigger.click();
      const palette = page.getByRole("dialog", { name: "Command palette" });
      await expect(palette).toBeVisible();
      const bounds = await palette.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    await page.goto("/personal-canon/");
    const passage = page.locator("details").first();
    await passage.locator("summary").click();
    await expect(passage.locator(".passage-text")).toBeVisible();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await passage.locator("summary").press("Enter");
    await expect(passage.locator(".passage-text")).toBeHidden();
  });
}

test("professor theme preserves the résumé print layout", async ({ page }) => {
  await page.goto("/resume/");
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => document.fonts.ready);
  const original = await page.screenshot({
    fullPage: true,
    animations: "disabled",
  });
  await page.emulateMedia({ media: "screen" });
  await runCommand(page, "CS Professor Website");
  await page.emulateMedia({ media: "print" });
  expect(
    (await page.screenshot({ fullPage: true, animations: "disabled" })).equals(
      original,
    ),
  ).toBe(true);
});
