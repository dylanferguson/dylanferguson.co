# dylanferguson.co

Built with [Astro](https://astro.build/) and hosted with [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/).

## Development

Requires Node.js 24+ (matching the Cloudflare Workers build) and [pnpm](https://pnpm.io/).

```sh
pnpm install
pnpm dev
```

Useful commands:

```sh
pnpm dev        # run the Astro development server
pnpm build      # build dist files
pnpm verify     # everything the pre-commit hook checks
pnpm resume     # regenerate the résumé PDF from the /resume/ page
pnpm format     # format supported source and data files
```

## Checks

`pnpm install` points `core.hooksPath` at `.githooks/`, so a pre-commit hook
runs `pnpm verify` — types, lint, build, and the résumé PDF freshness check
described below. It takes a few seconds and is quiet unless something fails.

Nothing runs on the server: Cloudflare only runs the build, so the hook is what
keeps a broken commit from reaching `main`. Use `git commit --no-verify` to skip
it deliberately.

The hook checks the working tree rather than the staged snapshot, which is the
usual trade-off for keeping it fast — a partial commit is the case it can't see.

## Deployment

Pushing to `main` is the deploy. Cloudflare Workers watches the branch, and
picks up each push automatically:

```sh
git push origin main
```

Cloudflare runs the build itself, using these settings:

```text
Build command: pnpm build
Deploy command: pnpm deploy
NODE_VERSION=24
PNPM_VERSION=11.2.2
```

Both commands run on Cloudflare's builder, not on your machine. `pnpm deploy`
exists for that build configuration to call — running it by hand pushes your
local `dist/` straight to production, skipping the branch, so leave it alone.

## Résumé

`data/resume.json5` is the single source of truth. The `/resume/` page renders
it, and the PDF is that same page printed by headless Chrome — there is no
second template to keep in sync.

```sh
pnpm resume   # rebuilds the site, prints the PDF, updates .resume-stamp
```

The PDF is committed, so the production build never needs Chrome. That leaves it
free to drift away from the page, so `pnpm resume` also records a hash of the
built page in `.resume-stamp`, and `pnpm verify` fails when the two disagree.
Commit the PDF and the stamp together.

Because the stamp hashes the *built* page, it follows every input on its own —
the data, the page, its layouts, and the stylesheet (which Astro content-hashes
into its filename). There is no list of résumé source files to keep up to date.

Override `CHROME=...` if Chrome lives somewhere other than
`/Applications/Google Chrome.app`.

Keep the layout parser-friendly: single column, real text, standard section
headings. Applicant tracking systems choke on multi-column layouts and on
anything that carries meaning in an icon or a background image.
