'use client';

import { useState, useCallback } from 'react';
import { Check, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ChecklistItem {
    /** Item label */
    label: string;
    /** Optional detailed description */
    description?: string;
    /** Whether item is initially checked */
    defaultChecked?: boolean;
}

interface QuickChecklistProps {
    /** Checklist title */
    title?: string;
    /** Array of checklist items */
    items: ChecklistItem[];
    /** Additional CSS classes */
    className?: string;
}

/**
 * Interactive checklist for verification guides and pre-flight checks.
 *
 * @example
 * ```mdx
 * <QuickChecklist
 *   title="Antes de Atualizar"
 *   items={[
 *     { label: 'Backup dos saves', description: 'Copie a pasta RetroArch/saves para seu PC' },
 *     { label: 'Bateria acima de 50%' },
 *     { label: 'Cartão SD formatado corretamente' },
 *   ]}
 * />
 * ```
 */
export function QuickChecklist({ title, items, className }: QuickChecklistProps) {
    const [checked, setChecked] = useState<boolean[]>(
        items.map((item) => item.defaultChecked ?? false)
    );
    const [expanded, setExpanded] = useState<boolean[]>(items.map(() => false));

    const toggleCheck = useCallback((index: number) => {
        setChecked((prev) => {
            const next = [...prev];
            next[index] = !next[index];
            return next;
        });
    }, []);

    const toggleExpand = useCallback((index: number) => {
        setExpanded((prev) => {
            const next = [...prev];
            next[index] = !next[index];
            return next;
        });
    }, []);

    const completedCount = checked.filter(Boolean).length;
    const progress = (completedCount / items.length) * 100;

    return (
        <div className={cn('my-6 p-6 rounded-lg border border-border bg-card', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                {title && (
                    <h4 className="font-semibold text-foreground">{title}</h4>
                )}
                <span className="text-sm text-(--fd-primary)">
                    {completedCount} de {items.length}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-zinc-600/20 rounded-full mb-4 overflow-hidden">
                <div
                    className="h-full bg-(--fd-primary) transition-all duration-300"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={completedCount}
                    aria-valuemin={0}
                    aria-valuemax={items.length}
                />
            </div>

            {/* Items */}
            <ul className="space-y-2 list-none pl-0 m-0">
                {items.map((item, index) => {
                    const isChecked = checked[index];
                    const isExpanded = expanded[index];
                    const hasDescription = Boolean(item.description);

                    return (
                        <li key={index} className="list-none">
                            <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={isChecked}
                                    onClick={() => toggleCheck(index)}
                                    className={cn(
                                        'shrink-0 size-5 rounded border-2 transition-all mt-0.5 flex items-center justify-center',
                                        isChecked
                                            ? 'bg-primary border-primary'
                                            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary'
                                    )}
                                >
                                    {isChecked ? (
                                        <Check className="size-3.5 text-primary-foreground" aria-hidden="true" />
                                    ) : (
                                        <span className="sr-only">Não marcado</span>
                                    )}
                                </button>

                                {/* Label and description */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'text-sm transition-colors',
                                                isChecked
                                                    ? 'text-muted-foreground line-through'
                                                    : 'text-foreground'
                                            )}
                                        >
                                            {item.label}
                                        </span>
                                        {hasDescription && (
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(index)}
                                                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                                                aria-expanded={isExpanded}
                                                aria-label={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="size-4" />
                                                ) : (
                                                    <ChevronRight className="size-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    {hasDescription && isExpanded && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
