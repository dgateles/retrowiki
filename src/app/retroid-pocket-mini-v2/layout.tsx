import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { consoleDocsOptions, consoleTabs } from '@/lib/layout.shared';
import { retroidPocketMiniV2Source } from '@/lib/source';

export default function RetroidPocketMiniV2Layout({ children }: { children: ReactNode }) {
    return (
        <DocsLayout
            tree={retroidPocketMiniV2Source.pageTree}
            {...consoleDocsOptions()}
            sidebar={{
                tabs: consoleTabs,
            }}
        >
            {children}
        </DocsLayout>
    );
}
