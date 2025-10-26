/**
 * Sitemap Generator - Auto-generate sitemap.xml for search engines
 *
 * Features:
 * - Dynamic sitemap generation from database
 * - Multiple sitemap files for large sites (sitemap index)
 * - Priority and change frequency configuration
 * - Last modified dates
 * - Image sitemaps for portfolios
 */

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{
    loc: string;
    title?: string;
    caption?: string;
  }>;
}

interface SitemapConfig {
  baseUrl: string;
  defaultChangefreq?: 'daily' | 'weekly' | 'monthly';
  defaultPriority?: number;
}

/**
 * Generate XML for a single sitemap
 */
export function generateSitemap(urls: SitemapUrl[], config?: Partial<SitemapConfig>): string {
  const baseUrl = config?.baseUrl || 'https://beautycita.com';

  const urlEntries = urls.map((url) => {
    const images = url.images
      ? url.images
          .map(
            (img) => `
      <image:image>
        <image:loc>${escapeXml(img.loc)}</image:loc>
        ${img.title ? `<image:title>${escapeXml(img.title)}</image:title>` : ''}
        ${img.caption ? `<image:caption>${escapeXml(img.caption)}</image:caption>` : ''}
      </image:image>`
          )
          .join('')
      : '';

    return `
  <url>
    <loc>${escapeXml(url.loc.startsWith('http') ? url.loc : `${baseUrl}${url.loc}`)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority.toFixed(1)}</priority>` : ''}
    ${images}
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
}

/**
 * Generate sitemap index (for sites with multiple sitemaps)
 */
export function generateSitemapIndex(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
  const entries = sitemaps
    .map(
      (sitemap) => `
  <sitemap>
    <loc>${escapeXml(sitemap.loc)}</loc>
    ${sitemap.lastmod ? `<lastmod>${sitemap.lastmod}</lastmod>` : ''}
  </sitemap>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date to W3C format (ISO 8601)
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

// ==================== BEAUTYCITA-SPECIFIC SITEMAP GENERATORS ====================

/**
 * Generate static pages sitemap
 */
export async function generateStaticPagesSitemap(): Promise<string> {
  const staticPages: SitemapUrl[] = [
    {
      loc: '/',
      changefreq: 'daily',
      priority: 1.0,
      lastmod: formatDate(new Date()),
    },
    {
      loc: '/about',
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      loc: '/how-it-works',
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      loc: '/pricing',
      changefreq: 'weekly',
      priority: 0.9,
    },
    {
      loc: '/contact',
      changefreq: 'monthly',
      priority: 0.7,
    },
    {
      loc: '/blog',
      changefreq: 'daily',
      priority: 0.9,
    },
    {
      loc: '/stylists',
      changefreq: 'daily',
      priority: 0.9,
    },
    {
      loc: '/services',
      changefreq: 'weekly',
      priority: 0.8,
    },
  ];

  return generateSitemap(staticPages, { baseUrl: 'https://beautycita.com' });
}

/**
 * Generate stylist profiles sitemap
 */
export async function generateStylistsSitemap(db: any): Promise<string> {
  // Fetch all active stylists from database
  const stylists = await db.query(`
    SELECT
      username,
      updated_at,
      profile_image
    FROM stylists
    WHERE is_active = true
    ORDER BY updated_at DESC
  `);

  const urls: SitemapUrl[] = stylists.rows.map((stylist: any) => ({
    loc: `/stylist/${stylist.username}`,
    lastmod: formatDate(stylist.updated_at),
    changefreq: 'weekly' as const,
    priority: 0.8,
    images: stylist.profile_image
      ? [
          {
            loc: stylist.profile_image,
            title: `${stylist.username} - Beauty Professional`,
          },
        ]
      : [],
  }));

  return generateSitemap(urls, { baseUrl: 'https://beautycita.com' });
}

/**
 * Generate blog posts sitemap
 */
export async function generateBlogSitemap(db: any): Promise<string> {
  const posts = await db.query(`
    SELECT
      slug,
      updated_at,
      featured_image,
      title
    FROM blog_posts
    WHERE published = true
    ORDER BY updated_at DESC
  `);

  const urls: SitemapUrl[] = posts.rows.map((post: any) => ({
    loc: `/blog/${post.slug}`,
    lastmod: formatDate(post.updated_at),
    changefreq: 'monthly' as const,
    priority: 0.7,
    images: post.featured_image
      ? [
          {
            loc: post.featured_image,
            title: post.title,
          },
        ]
      : [],
  }));

  return generateSitemap(urls, { baseUrl: 'https://beautycita.com' });
}

/**
 * Generate services sitemap
 */
export async function generateServicesSitemap(db: any): Promise<string> {
  const services = await db.query(`
    SELECT DISTINCT
      name,
      category,
      updated_at
    FROM services
    WHERE is_active = true
    ORDER BY category, name
  `);

  const urls: SitemapUrl[] = services.rows.map((service: any) => ({
    loc: `/services/${service.name.toLowerCase().replace(/\s+/g, '-')}`,
    lastmod: formatDate(service.updated_at),
    changefreq: 'monthly' as const,
    priority: 0.6,
  }));

  return generateSitemap(urls, { baseUrl: 'https://beautycita.com' });
}

/**
 * Generate portfolio items sitemap (with images)
 */
export async function generatePortfolioSitemap(db: any): Promise<string> {
  const portfolios = await db.query(`
    SELECT
      p.id,
      s.username,
      p.images,
      p.title,
      p.description,
      p.updated_at
    FROM portfolio_items p
    JOIN stylists s ON p.stylist_id = s.id
    WHERE p.is_public = true AND s.is_active = true
    ORDER BY p.updated_at DESC
  `);

  const urls: SitemapUrl[] = portfolios.rows.map((item: any) => ({
    loc: `/stylist/${item.username}/portfolio/${item.id}`,
    lastmod: formatDate(item.updated_at),
    changefreq: 'monthly' as const,
    priority: 0.7,
    images: item.images.map((img: string, index: number) => ({
      loc: img,
      title: item.title || `Portfolio item ${index + 1}`,
      caption: item.description,
    })),
  }));

  return generateSitemap(urls, { baseUrl: 'https://beautycita.com' });
}

/**
 * Generate city/location pages sitemap
 */
export async function generateLocationsSitemap(db: any): Promise<string> {
  const locations = await db.query(`
    SELECT DISTINCT
      city,
      state,
      COUNT(*) as stylist_count
    FROM stylists
    WHERE is_active = true
    GROUP BY city, state
    HAVING COUNT(*) >= 3
    ORDER BY stylist_count DESC
  `);

  const urls: SitemapUrl[] = locations.rows.map((loc: any) => ({
    loc: `/stylists/${loc.state.toLowerCase()}/${loc.city.toLowerCase().replace(/\s+/g, '-')}`,
    changefreq: 'weekly' as const,
    priority: 0.8,
  }));

  return generateSitemap(urls, { baseUrl: 'https://beautycita.com' });
}

/**
 * Generate complete sitemap index
 */
export async function generateCompleteSitemapIndex(db: any): Promise<string> {
  const now = formatDate(new Date());

  const sitemaps = [
    {
      loc: 'https://beautycita.com/sitemap-static.xml',
      lastmod: now,
    },
    {
      loc: 'https://beautycita.com/sitemap-stylists.xml',
      lastmod: now,
    },
    {
      loc: 'https://beautycita.com/sitemap-blog.xml',
      lastmod: now,
    },
    {
      loc: 'https://beautycita.com/sitemap-services.xml',
      lastmod: now,
    },
    {
      loc: 'https://beautycita.com/sitemap-portfolio.xml',
      lastmod: now,
    },
    {
      loc: 'https://beautycita.com/sitemap-locations.xml',
      lastmod: now,
    },
  ];

  return generateSitemapIndex(sitemaps);
}

// ==================== EXPRESS.JS ROUTES ====================

/**
 * Express route handlers for sitemap endpoints
 */
export function setupSitemapRoutes(app: any, db: any) {
  // Main sitemap index
  app.get('/sitemap.xml', async (req: any, res: any) => {
    try {
      const sitemap = await generateCompleteSitemapIndex(db);
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap index:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Static pages sitemap
  app.get('/sitemap-static.xml', async (req: any, res: any) => {
    try {
      const sitemap = await generateStaticPagesSitemap();
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating static sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Stylists sitemap
  app.get('/sitemap-stylists.xml', async (req: any, res: any) => {
    try {
      const sitemap = await generateStylistsSitemap(db);
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating stylists sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Blog sitemap
  app.get('/sitemap-blog.xml', async (req: any, res: any) => {
    try {
      const sitemap = await generateBlogSitemap(db);
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating blog sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Services sitemap
  app.get('/sitemap-services.xml', async (req: any, res: any) => {
    try {
      const sitemap = await generateServicesSitemap(db);
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating services sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Portfolio sitemap
  app.get('/sitemap-portfolio.xml', async (req: any, res: any) => {
    try {
      const sitemap = await generatePortfolioSitemap(db);
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating portfolio sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Locations sitemap
  app.get('/sitemap-locations.xml', async (req: any, res: any) => {
    try {
      const sitemap = await generateLocationsSitemap(db);
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating locations sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });
}

// ==================== CRON JOB / SCHEDULED GENERATION ====================

/**
 * Generate and save all sitemaps to files (for static hosting)
 */
export async function generateAndSaveSitemaps(db: any, outputDir: string) {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Generate all sitemaps
    const sitemaps = {
      'sitemap.xml': await generateCompleteSitemapIndex(db),
      'sitemap-static.xml': await generateStaticPagesSitemap(),
      'sitemap-stylists.xml': await generateStylistsSitemap(db),
      'sitemap-blog.xml': await generateBlogSitemap(db),
      'sitemap-services.xml': await generateServicesSitemap(db),
      'sitemap-portfolio.xml': await generatePortfolioSitemap(db),
      'sitemap-locations.xml': await generateLocationsSitemap(db),
    };

    // Write all sitemaps to files
    for (const [filename, content] of Object.entries(sitemaps)) {
      const filepath = path.join(outputDir, filename);
      await fs.writeFile(filepath, content, 'utf-8');
      console.log(`Generated ${filename}`);
    }

    console.log('All sitemaps generated successfully!');
  } catch (error) {
    console.error('Error generating sitemaps:', error);
    throw error;
  }
}

// ==================== USAGE EXAMPLE ====================

/*
// In your Express app:
import { setupSitemapRoutes } from './sitemap-generator';

setupSitemapRoutes(app, db);

// For scheduled generation (e.g., with node-cron):
import cron from 'node-cron';

// Regenerate sitemaps daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Regenerating sitemaps...');
  await generateAndSaveSitemaps(db, './public');
});
*/

export default {
  generateSitemap,
  generateSitemapIndex,
  generateStaticPagesSitemap,
  generateStylistsSitemap,
  generateBlogSitemap,
  generateServicesSitemap,
  generatePortfolioSitemap,
  generateLocationsSitemap,
  generateCompleteSitemapIndex,
  setupSitemapRoutes,
  generateAndSaveSitemaps,
};
