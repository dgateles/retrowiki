import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { retroidPocket6Source } from '@/lib/source';

export default function RetroidPocket6Layout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={retroidPocket6Source.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
