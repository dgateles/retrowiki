import { mangmiAirXSource } from '@/lib/source';
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';

export function generateStaticParams() {
    return mangmiAirXSource.generateParams();
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const params = await props.params;
    const page = mangmiAirXSource.getPage(params.slug);
    if (!page) return {};

    const title = page.data.title;
    const description = page.data.description;

    const url = `https://retro.wiki.br/mangmi-air-x${params.slug ? `/${params.slug.join('/')}` : ''}`;

    return {
        title,
        description,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title: `${title} | Mangmi Air X - Retro Wiki`,
            description,
            type: 'article',
            siteName: 'Retro Wiki',
            locale: 'pt_BR',
            url,
        },
        twitter: {
            card: 'summary',
            title: `${title} | Mangmi Air X - Retro Wiki`,
            description,
        },
    };
}

interface PageProps {
    params: Promise<{ slug?: string[] }>;
}

export default async function MangmiAirXPage(props: PageProps) {
    const params = await props.params;
    const page = mangmiAirXSource.getPage(params.slug);
    if (!page) notFound();
    const MDX = page.data.body;

    return (
        <DocsPage toc={page.data.toc} full={page.data.full}>
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription>{page.data.description}</DocsDescription>
            <DocsBody>
                <MDX components={getMDXComponents()} />
            </DocsBody>
        </DocsPage>
    );
}
