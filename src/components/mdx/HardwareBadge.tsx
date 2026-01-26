import { Cpu, MemoryStick, Monitor, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface HardwareBadgeProps {
    /** Chip/CPU name */
    chip?: string;
    /** RAM amount */
    ram?: string;
    /** Panel/screen type */
    panel?: string;
    /** WiFi support */
    wifi?: boolean | string;
    /** Show as compact inline or expanded cards */
    variant?: 'inline' | 'cards';
    /** Additional CSS classes */
    className?: string;
}

interface BadgeInfo {
    icon: typeof Cpu;
    label: string;
    value: string;
}

/**
 * Hardware specification badge display component.
 *
 * @example
 * ```mdx
 * <HardwareBadge
 *   chip="RK3566"
 *   ram="1GB DDR4"
 *   panel="IPS 640x480"
 *   wifi={true}
 * />
 * ```
 */
export function HardwareBadge({
    chip,
    ram,
    panel,
    wifi,
    variant = 'inline',
    className,
}: HardwareBadgeProps) {
    const badges: BadgeInfo[] = [];

    if (chip) {
        badges.push({ icon: Cpu, label: 'CPU', value: chip });
    }
    if (ram) {
        badges.push({ icon: MemoryStick, label: 'RAM', value: ram });
    }
    if (panel) {
        badges.push({ icon: Monitor, label: 'Tela', value: panel });
    }
    if (wifi !== undefined) {
        const wifiValue = typeof wifi === 'string' ? wifi : wifi ? 'Sim' : 'Não';
        badges.push({
            icon: wifi ? Wifi : WifiOff,
            label: 'WiFi',
            value: wifiValue,
        });
    }

    if (badges.length === 0) return null;

    if (variant === 'cards') {
        return (
            <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3 my-4', className)}>
                {badges.map((badge, index) => {
                    const Icon = badge.icon;
                    return (
                        <div
                            key={index}
                            className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border"
                        >
                            <Icon
                                className="size-5 text-primary"
                                aria-hidden="true"
                            />
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    {badge.label}
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                    {badge.value}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={cn('flex flex-wrap gap-2 my-4', className)}>
            {badges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                    <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-medium"
                    >
                        <Icon
                            className="size-3.5 text-primary"
                            aria-hidden="true"
                        />
                        <span className="text-muted-foreground">{badge.label}:</span>
                        <span className="text-foreground">{badge.value}</span>
                    </span>
                );
            })}
        </div>
    );
}
