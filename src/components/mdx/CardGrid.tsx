import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardGridProps {
    /** Grid children (usually CardLink components) */
    children: ReactNode;
    /** Number of columns on desktop (default: 2) */
    columns?: 2 | 3 | 4;
    /** Additional CSS classes */
    className?: string;
}

const columnClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
};

/**
 * Grid container for arranging CardLink components in a responsive layout.
 *
 * @example
 * ```mdx
 * <CardGrid columns={3}>
 *   <CardLink title="R36S" href="/docs/consoles/r36s" />
 *   <CardLink title="Miyoo Mini" href="/docs/consoles/miyoo-mini" />
 *   <CardLink title="RG35XX" href="/docs/consoles/rg35xx" />
 * </CardGrid>
 * ```
 */
export function CardGrid({ children, columns = 2, className }: CardGridProps) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 gap-4 my-6',
                columnClasses[columns],
                className
            )}
        >
            {children}
        </div>
    );
}
