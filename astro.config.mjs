import { rmSync } from "node:fs";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

import { withLastmod } from "./scripts/page-lastmod.mjs";

function writingsEnabled() {
  const value = process.env.WRITINGS;
  return value === "true";
}

function omitPrivateWritings() {
  return {
    name: "omit-private-writings",
    hooks: {
      "astro:build:done": ({ dir }) => {
        if (writingsEnabled()) return;
        rmSync(new URL("writings", dir), { recursive: true, force: true });
      },
    },
  };
}

export default defineConfig({
  site: "https://dylanferguson.co",
  prefetch: {
    // Without prefetchAll, only links carrying data-astro-prefetch are
    // prefetched, and defaultStrategy applies to nothing.
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  env: {
    schema: {
      // Stamped into a <meta> by the build script; empty in `astro dev`
      // when the shell has not set it.
      BUILD_COMMIT: envField.string({
        context: "server",
        access: "public",
        default: "",
      }),
      // Off in `astro build` unless the shell sets WRITINGS=true. `pnpm dev` does.
      WRITINGS: envField.boolean({
        context: "server",
        access: "public",
        default: false,
      }),
    },
  },
  integrations: [
    mdx(),
    svelte(),
    omitPrivateWritings(),
    // /personal-canon/ renders with noindex, so keep it out of the sitemap too.
    // filter runs before serialize, so withLastmod never sees the excluded page.
    sitemap({
      filter: (page) => {
        if (page.includes("/personal-canon/")) return false;
        if (!writingsEnabled() && page.includes("/writings/")) return false;
        return true;
      },
      serialize: withLastmod,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
