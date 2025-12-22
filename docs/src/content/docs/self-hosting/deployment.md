---
title: Deployment Guide
description: How to deploy Sakiyomi on your own infrastructure.
---

Sakiyomi can be self-hosted on various platforms. This guide covers deployment to Vercel with Supabase.

## Prerequisites

- Node.js 18+ or Bun
- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account (or another hosting provider)

## 1. Clone the Repository

```bash
git clone https://github.com/thatcatdev/sakiyomi.git
cd sakiyomi
```

## 2. Set Up Supabase

1. Create a new Supabase project
2. Run the migrations:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

## 3. Configure Environment Variables

Create a `.env` file:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Deploy to Vercel

1. Push your repo to GitHub
2. Import the project in Vercel
3. Add the environment variables
4. Deploy!

## Alternative Platforms

The app uses the Astro Vercel adapter, but you can swap it for:
- **Netlify**: `@astrojs/netlify`
- **Node.js**: `@astrojs/node`
- **Cloudflare**: `@astrojs/cloudflare`

See the [Astro deployment docs](https://docs.astro.build/en/guides/deploy/) for more options.
