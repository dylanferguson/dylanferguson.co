import { preview } from "astro";

// Astro's CLI detaches under coding agents; Playwright must own the server.
await preview({ server: { host: "127.0.0.1", port: 4322 } });
