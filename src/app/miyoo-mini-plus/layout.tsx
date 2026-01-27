import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { miyooMiniPlusSource } from '@/lib/source';

/**
 * Miyoo Mini Plus documentation layout with console switcher dropdown.
 */
export default function MiyooMiniPlusLayout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={miyooMiniPlusSource.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
