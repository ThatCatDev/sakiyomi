# Sakiyomi

Story point estimation for planning sessions — a room, a deck of cards, and
everyone's estimate revealed at once.

**Live: [sakiyomi.dev](https://sakiyomi.dev)**

Built with [Astro](https://astro.build) and TypeScript, on
[Supabase](https://supabase.com) for the database, auth and realtime.

## Running it

Requires [Bun](https://bun.sh) and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```sh
bun install
bun run supabase:start    # local Supabase stack
bun run dev               # dev server
```

Copy `.env.example` to `.env.local` and fill in the Supabase URL and keys the
local stack prints on startup.

```sh
bun run build             # production build
bun run preview           # serve the build locally
```

## Tests

```sh
bun run test:unit         # Vitest
bun run test:e2e          # Playwright
bun run test:all          # both
bun run test:ui           # Playwright's UI mode
```

New features are expected to come with end-to-end coverage. Locators should be
`getByRole` or `getByText` rather than CSS selectors, so a test fails when the
page stops being usable rather than when a class name changes.

## Email templates

Templates are written in [MJML](https://mjml.io) under `supabase/templates` and
compiled before they are uploaded:

```sh
bun run build:emails
bun run deploy:emails
```

## Documentation

`docs/` is a separate Astro site with the user-facing documentation, and has its
own `package.json` and dev server.

`CLAUDE.md` holds the working conventions for the app itself — the UI patterns
it keeps to, and the SQL rules that matter when writing database functions.

## Deployment

See `DEPLOYMENT.md`. Migrations run from `.github/workflows/migrations.yml`, and
the Astro app builds against either the Vercel or the Node adapter.

## Licence

MIT.
