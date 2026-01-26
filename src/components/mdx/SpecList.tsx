import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SpecItem {
    /** Specification label */
    label: string;
    /** Specification value */
    value: string | ReactNode;
    /** Optional Lucide icon */
    icon?: LucideIcon;
}

interface SpecListProps {
    /** Array of specification items */
    items: SpecItem[];
    /** Layout orientation */
    layout?: 'horizontal' | 'vertical';
    /** Additional CSS classes */
    className?: string;
}

/**
 * Display component for hardware specifications or similar key-value data.
 *
 * @example
 * ```mdx
 * <SpecList
 *   items={[
 *     { label: 'CPU', value: 'RK3566 Quad-core 1.8GHz', icon: Cpu },
 *     { label: 'RAM', value: '1GB DDR4', icon: MemoryStick },
 *     { label: 'Tela', value: '3.5" IPS 640x480', icon: Monitor },
 *   ]}
 * />
 * ```
 */
export function SpecList({ items, layout = 'vertical', className }: SpecListProps) {
    if (layout === 'horizontal') {
        return (
            <div
                className={cn(
                    'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-6',
                    className
                )}
            >
                {items.map((item, index) => (
                    <SpecCard key={index} {...item} />
                ))}
            </div>
        );
    }

    return (
        <dl className={cn('my-6 space-y-3', className)}>
            {items.map((item, index) => (
                <SpecRow key={index} {...item} />
            ))}
        </dl>
    );
}

function SpecCard({ label, value, icon: Icon }: SpecItem) {
    return (
        <div className="rounded-lg border border-border bg-card p-4 h-full">
            <div className="flex items-center gap-2 mb-2">
                {Icon && (
                    <Icon
                        className="size-4 text-primary"
                        aria-hidden="true"
                    />
                )}
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </dt>
            </div>
            <dd className="text-sm font-semibold text-foreground wrap-break-word">
                {value}
            </dd>
        </div>
    );
}

function SpecRow({ label, value, icon: Icon }: SpecItem) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
            <dt className="flex items-center gap-2 text-muted-foreground">
                {Icon && (
                    <Icon className="size-4 text-primary" aria-hidden="true" />
                )}
                <span className="text-sm font-medium">{label}</span>
            </dt>
            <dd className="text-sm font-semibold text-foreground text-right">
                {value}
            </dd>
        </div>
    );
}
