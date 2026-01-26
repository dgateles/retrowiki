import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { rg35xxSource } from '@/lib/source';

/**
 * RG35XX documentation layout with console switcher dropdown.
 */
export default function RG35XXLayout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={rg35xxSource.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
