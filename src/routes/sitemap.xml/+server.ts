import { projects, thoughts } from '$lib/data';
import type { RequestHandler } from './$types';

const SITE_URL = 'https://aikoschurmann.com';

function toIsoDate(value: string): string | undefined {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().split('T')[0];
}

export const GET: RequestHandler = () => {
  const staticRoutes = ['/', '/projects', '/blog'];
  const dynamicRoutes = [...projects.map((project) => project.url), ...thoughts.map((thought) => thought.url)];
  const allRoutes = [...new Set([...staticRoutes, ...dynamicRoutes])];

  const today = new Date().toISOString().split('T')[0];
  const thoughtDateMap = new Map(thoughts.map((thought) => [thought.url, toIsoDate(thought.date)]));

  const urlset = allRoutes
    .map((route) => {
      const lastmod = thoughtDateMap.get(route) || today;
      return `  <url><loc>${SITE_URL}${route}</loc><lastmod>${lastmod}</lastmod></url>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'max-age=0, s-maxage=3600'
    }
  });
};
