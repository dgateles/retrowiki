import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { trimuiSource } from '@/lib/source';

/**
 * TrimUI documentation layout with console switcher dropdown.
 */
export default function TrimUILayout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={trimuiSource.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
