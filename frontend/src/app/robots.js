export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jadui-placement.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/dashboard/', '/interview/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
