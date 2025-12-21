---
title: Configuration
description: Environment variables and configuration options for self-hosting.
---

Configure your self-hosted instance using environment variables.

## Required Variables

| Variable | Description |
|----------|-------------|
| `PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_POSTHOG_KEY` | PostHog analytics key | - |
| `PUBLIC_POSTHOG_HOST` | PostHog API host | `https://us.i.posthog.com` |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification | - |

## Supabase Setup

### Database Schema

The app requires these tables (created by migrations):

- `rooms` - Estimation rooms
- `room_participants` - Users in each room

### Row Level Security

RLS policies are included in the migrations. They allow:
- Anyone to read rooms
- Participants to update their own data
- Managers to update room settings

### Realtime

Enable realtime for these tables in Supabase:
- `rooms`
- `room_participants`

## Branding

To customize branding for your domain, edit `src/lib/branding.ts`:

```typescript
const BRAND_CONFIG: Record<string, BrandConfig> = {
  'yourdomain.com': {
    name: 'Your App Name',
    shortName: 'YAN',
    tagline: 'Your tagline here',
    description: 'Your meta description',
    keywords: ['your', 'keywords'],
  },
};
```
