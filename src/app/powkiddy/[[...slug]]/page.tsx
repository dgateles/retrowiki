import { powkiddySource } from '@/lib/source';
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';

export function generateStaticParams() {
    return powkiddySource.generateParams();
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const params = await props.params;
    const page = powkiddySource.getPage(params.slug);
    if (!page) return {};

    const title = page.data.title;
    const description = page.data.description;

    return {
        title,
        description,
        openGraph: {
            title: `${title} | Retro Wiki`,
            description,
            type: 'article',
            siteName: 'Retro Wiki',
            locale: 'pt_BR',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} | Retro Wiki`,
            description,
        },
    };
}

interface PageProps {
    params: Promise<{ slug?: string[] }>;
}

export default async function PowKiddyPage(props: PageProps) {
    const params = await props.params;
    const page = powkiddySource.getPage(params.slug);
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
