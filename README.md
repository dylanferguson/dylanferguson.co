# 🌐 dylanferguson.co

<p align="center">
  <a href="https://dylanferguson.co/">
    <img src="docs/home.jpg" alt="dylanferguson.co" width="640">
  </a>
</p>

A small shoal on the web since 2013, forever a work in progress

## Development

[mise](https://mise.jdx.dev/) pins Node.js 24. [pnpm](https://pnpm.io/) is the package manager.

```sh
mise install
pnpm install
pnpm dev
```

```sh
pnpm dev        # Astro development server
pnpm build      # write dist/
pnpm verify     # types, lint, build, résumé PDF freshness
pnpm resume     # print /resume/ to public/resume.pdf
pnpm format     # format source and data files
pnpm test:e2e   # build and run command palette tests in Chromium
```

Before the first browser test run, install Chromium's headless shell with `pnpm exec playwright install chromium --only-shell`.

`pnpm install` points git at `.githooks/`. Commits then run `pnpm verify`.

Pushes to `main` deploy.

## Themes

Open the command palette with ⌘K / Ctrl+K and search for a theme name.
Theme selections persist across pages and reloads. Light/dark is a separate
preference: a theme can force a color scheme, and switching back restores your
appearance choice.
The light/dark toggle is available only for themes that follow this preference.

To add a theme, register its ID, name, color scheme (`null` follows the user's
preference), and whether it uses canvas effects in `src/themes.ts`. Add a
stylesheet under `src/styles/themes/`, import it from `src/styles/global.css`,
and scope its rules to `html[data-theme="your-id"]`. Palette commands are
generated from the registry. Keep screen-only themes inside `@media screen`
to preserve the résumé's print layout.
