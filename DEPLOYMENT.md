# Deployment Guide

## Vercel Deployment

### 1. Connect Repository

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Vercel should auto-detect Astro framework

### 2. Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (for cron cleanup) | Supabase Dashboard → Settings → API |
| `CRON_SECRET` | Random secret to protect cron endpoint | Generate with `openssl rand -hex 32` |

### 3. Cron Jobs

The `vercel.json` configures a cron job to clean up expired rooms:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-rooms",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

- Runs every 15 minutes
- Deletes rooms with no activity for 1 hour
- Protected by `CRON_SECRET`

**Note**: Vercel Hobby (free) plan only supports daily crons. Pro plan supports up to every minute.

### 4. Supabase Production Setup

1. Create a separate Supabase project for production
2. Run migrations against production:
   ```bash
   supabase link --project-ref YOUR_PROD_PROJECT_REF
   supabase db push
   ```
3. Update environment variables in Vercel with production Supabase credentials

### 5. Build Settings

Vercel should auto-detect these, but if needed:

- **Framework**: Astro
- **Build Command**: `bun run build`
- **Output Directory**: `dist`
- **Install Command**: `bun install`

## Local Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Run tests
bun run test

# Run tests with UI
bun run test:ui
```

## Database Migrations

```bash
# Link to Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Create new migration
supabase migration new migration_name
```
