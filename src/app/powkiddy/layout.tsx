import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { powkiddySource } from '@/lib/source';

/**
 * PowKiddy documentation layout with console switcher dropdown.
 */
export default function PowKiddyLayout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={powkiddySource.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
