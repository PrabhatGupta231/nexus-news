import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
        },
        sitemap: [
            'https://nexus24news.vercel.app/sitemap.xml',
            'https://nexus24news.vercel.app/news-sitemap.xml',
        ],
    };
}