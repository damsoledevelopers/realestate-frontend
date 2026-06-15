/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: ['/dashboard', '/dashboard/*', '/user-dashboard', '/user-dashboard/*', '/login', '/register', '/my-bookings', '/profile'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/dashboard', '/user-dashboard', '/login', '/register', '/my-bookings', '/profile'] },
    ],
  },
  additionalPaths: async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiUrl}/layouts`);
      if (!res.ok) return [];

      const json = await res.json();
      const layouts = json.data;

      if (!Array.isArray(layouts)) return [];

      return layouts.map((layout) => ({
        loc: `/layouts/${layout._id}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: layout.updatedAt || layout.createdAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },
};
