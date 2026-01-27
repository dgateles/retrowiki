import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { trimuiSmartBrickSource } from '@/lib/source';

/**
 * TrimUI Smart Brick documentation layout with console switcher dropdown.
 */
export default function TrimUISmartBrickLayout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={trimuiSmartBrickSource.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
