import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StatCardProps {
    /** Stat value (e.g., "48", "8h") */
    value: string | number;
    /** Stat label (e.g., "emuladores", "bateria") */
    label: string;
    /** Optional Lucide icon */
    icon?: LucideIcon;
    /** Additional CSS classes */
    className?: string;
}

interface StatGridProps {
    /** Stat children */
    children: React.ReactNode;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Grid container for StatCard components.
 */
export function StatGrid({ children, className }: StatGridProps) {
    return (
        <div
            className={cn(
                'grid grid-cols-2 md:grid-cols-4 gap-4 my-8',
                className
            )}
        >
            {children}
        </div>
    );
}

/**
 * Single stat display card with value, label, and optional icon.
 *
 * @example
 * ```mdx
 * <StatGrid>
 *   <StatCard value="48" label="Emuladores" icon={Gamepad2} />
 *   <StatCard value="8h" label="Bateria" icon={Battery} />
 *   <StatCard value="10+" label="Consoles" icon={Monitor} />
 * </StatGrid>
 * ```
 */
export function StatCard({ value, label, icon: Icon, className }: StatCardProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl bg-card border border-border p-4 text-center',
                className
            )}
        >
            {/* Background gradient glow */}
            <div
                className="absolute inset-0 bg-linear-to-br from-primary/10 to-transparent pointer-events-none"
                aria-hidden="true"
            />

            {Icon && (
                <div className="flex justify-center mb-2">
                    <Icon
                        className="size-6 text-primary"
                        aria-hidden="true"
                    />
                </div>
            )}

            <p className="text-2xl md:text-3xl font-bold text-foreground">
                {value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
                {label}
            </p>
        </div>
    );
}
