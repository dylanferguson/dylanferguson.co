import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

import { withLastmod } from "./scripts/page-lastmod.mjs";

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
    },
  },
  integrations: [
    mdx(),
    // /personal-canon/ renders with noindex, so keep it out of the sitemap too.
    // filter runs before serialize, so withLastmod never sees the excluded page.
    sitemap({
      filter: (page) => !page.includes("/personal-canon/"),
      serialize: withLastmod,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
