import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const baseUrl = url.origin;

  const pages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/login', priority: '0.5', changefreq: 'monthly' },
    { loc: '/signup', priority: '0.5', changefreq: 'monthly' },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
