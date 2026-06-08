import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { mangmiAirXSource } from '@/lib/source';

export default function MangmiAirXLayout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={mangmiAirXSource.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
