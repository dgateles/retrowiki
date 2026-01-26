import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { r36sSource } from '@/lib/source';

/**
 * R36S documentation layout with console switcher dropdown.
 */
export default function R36SLayout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={r36sSource.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
