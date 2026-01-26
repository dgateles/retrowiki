import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

import {
    source,
    r36sSource,
    miyooSource,
    rg35xxSource,
    trimuiSource,
    powkiddySource
} from '@/lib/source';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://retro.wiki.br';

    const routes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/apoie`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
    ];

    const addSource = (src: any) => {
        return src.getPages().map((page: any) => ({
            url: `${baseUrl}${page.url}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }));
    };

    return [
        ...routes,
        ...addSource(source),
        ...addSource(r36sSource),
        ...addSource(miyooSource),
        ...addSource(rg35xxSource),
        ...addSource(trimuiSource),
        ...addSource(powkiddySource),
    ];
}
