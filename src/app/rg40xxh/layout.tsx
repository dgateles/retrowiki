import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { rg40xxhSource } from '@/lib/source';

/**
 * RG40XX H documentation layout with console switcher dropdown.
 */
export default function RG40XXHLayout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={rg40xxhSource.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
