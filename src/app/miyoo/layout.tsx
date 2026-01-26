import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { miyooSource } from '@/lib/source';

/**
 * Miyoo Mini documentation layout with console switcher dropdown.
 */
export default function MiyooLayout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={miyooSource.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
