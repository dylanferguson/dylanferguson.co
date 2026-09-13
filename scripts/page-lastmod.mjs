// Resolve a route's sitemap <lastmod> from git history: the date of the most
// recent commit touching any of that route's sources.
//
// Git rather than filesystem mtime, because a fresh clone sets every mtime to
// checkout time, which would claim every page changed on every deploy. Google
// discounts a lastmod it learns not to trust, so a wrong date is worse than
// none.
//
// Builds run on Cloudflare from a clone of the repository, so git is present.
// Depth is the thing to watch: in a shallow clone `git log -1` can only ever
// report the tip commit, so every route would collapse to one date and look
// plausible while meaning nothing. That case ships no date at all.
//
// The route map is maintained by hand. Astro cannot supply it: content
// collections reach a page through the virtual `astro:content` module and are
// read by the content layer with fs, so `data/*.json5` never enters Vite's
// module graph and no build hook knows a page depends on it.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Page and data only. Shared layouts and components are deliberately absent: a
// change to type or spacing shouldn't claim every page's content is newer than
// Google's copy. Adding a route means adding it here — one is missing if the
// build warns.
const ROUTE_SOURCES = {
  "/": ["src/pages/index.astro"],
  "/resume/": ["src/pages/resume.astro", "data/resume.json5"],
  "/software-canon/": [
    "src/pages/software-canon.astro",
    "data/software_canon.json5",
  ],
};

function routeSources(pathname) {
  if (pathname === "/writings/") {
    return ["src/pages/writings/index.astro", "src/content/writings"];
  }
  const post = pathname.match(/^\/writings\/([^/]+)\/$/);
  if (post) {
    const slug = post[1];
    return [
      `src/content/writings/${slug}.md`,
      `src/content/writings/${slug}.mdx`,
    ];
  }
  return ROUTE_SOURCES[pathname];
}

function git(args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

// Memoised: the answer cannot change mid-build, and serialize runs per route.
let shallow;

function isShallowClone() {
  if (shallow === undefined) {
    try {
      shallow = git(["rev-parse", "--is-shallow-repository"]) === "true";
    } catch {
      shallow = false; // No repository at all — lastCommitDate reports that.
    }
  }
  return shallow;
}

// `git log -1` over several paths already reports the most recent commit
// touching any of them, so there is no maximum to work out here.
function lastCommitDate(paths) {
  try {
    const stdout = git(["log", "-1", "--format=%cI", "--", ...paths]);
    if (stdout === "") return undefined;
    const date = new Date(stdout);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  } catch {
    // No git, no repository, or a path that has never been committed. Omit the
    // date rather than failing the build — <lastmod> is optional per the
    // sitemaps protocol.
    return undefined;
  }
}

/**
 * `serialize` hook for @astrojs/sitemap. Must always return the item: the
 * integration drops any URL for which serialize returns a falsy value.
 */
export function withLastmod(item) {
  const { pathname } = new URL(item.url);

  if (isShallowClone()) {
    console.warn(
      `[page-lastmod] shallow clone: every route would report the tip commit, ` +
        `so no <lastmod> is being written. Fetch full history in the build.`,
    );
    return item;
  }
  const sources = routeSources(pathname);

  if (!sources) {
    console.warn(
      `[page-lastmod] ${pathname} has no sources listed, shipping no <lastmod>. ` +
        `Add it in scripts/page-lastmod.mjs.`,
    );
    return item;
  }

  const lastmod = lastCommitDate(sources);
  if (!lastmod) {
    console.warn(
      `[page-lastmod] no commit found for ${pathname}, shipping no <lastmod>.`,
    );
    return item;
  }

  return { ...item, lastmod };
}
