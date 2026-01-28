import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

import {
    source,
    r36sSource,
    miyooMiniPlusSource,
    rg35xxSource,
    trimuiSmartBrickSource,
    rg40xxhSource,
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
            url: `${baseUrl}/roms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/apoie`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
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
        ...addSource(miyooMiniPlusSource),
        ...addSource(rg35xxSource),
        ...addSource(trimuiSmartBrickSource),
        ...addSource(rg40xxhSource),
        ...addSource(powkiddySource),
    ];
}
