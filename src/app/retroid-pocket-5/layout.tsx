import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { retroidPocket5Source } from '@/lib/source';

export default function RetroidPocket5Layout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={retroidPocket5Source.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
