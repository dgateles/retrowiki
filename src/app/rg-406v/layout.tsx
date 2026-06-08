import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { rg406vSource } from '@/lib/source';

export default function RG406VLayout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={rg406vSource.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
