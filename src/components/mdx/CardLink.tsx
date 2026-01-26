import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CardLinkProps {
    /** Card title */
    title: string;
    /** Short description */
    description?: string;
    /** Link destination (internal or external) */
    href: string;
    /** Optional badge text (e.g., "Novo", "Beta") */
    badge?: string;
    /** Badge variant */
    badgeVariant?: 'accent' | 'secondary' | 'success' | 'warning' | 'error';
    /** Optional Lucide icon component */
    icon?: LucideIcon;
    /** Whether the link is external */
    external?: boolean;
    /** Additional CSS classes */
    className?: string;
}

const badgeClasses = {
    accent: 'rw-badge-accent',
    secondary: 'rw-badge-secondary',
    success: 'rw-badge-success',
    warning: 'rw-badge-warning',
    error: 'rw-badge-error',
};

/**
 * Interactive card component for navigation within documentation.
 * Features hover effects with subtle glow and optional badge.
 *
 * @example
 * ```mdx
 * <CardLink
 *   title="Firmware R36S"
 *   description="Guia completo de instalação e atualização"
 *   href="/docs/consoles/r36s/firmware"
 *   badge="Atualizado"
 *   badgeVariant="success"
 * />
 * ```
 */
export function CardLink({
    title,
    description,
    href,
    badge,
    badgeVariant = 'accent',
    icon: Icon,
    external,
    className,
}: CardLinkProps) {
    const isExternal = external ?? href.startsWith('http');

    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
                            <Icon className="size-5" aria-hidden="true" />
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {badge && (
                    <span className={cn('rw-badge shrink-0', badgeClasses[badgeVariant])}>
                        {badge}
                    </span>
                )}
            </div>
            <ArrowRight
                className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all absolute bottom-4 right-4"
                aria-hidden="true"
            />
        </>
    );

    const cardClasses = cn(
        'group relative block no-underline rounded-lg border border-border bg-card p-4 transition-all hover:bg-accent/5',
        'hover:border-primary/50 hover:shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        '[&_*]:no-underline',
        className
    );

    if (isExternal) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClasses}
            >
                {content}
            </a>
        );
    }

    return (
        <Link href={href} className={cardClasses}>
            {content}
        </Link>
    );
}
