'use client';

import { useState, useMemo, useCallback, type ChangeEvent } from 'react';
import { Search, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

type CompatibilityStatus = 'compatible' | 'partial' | 'incompatible' | 'unknown';

interface CompatibilityItem {
    /** Item name/identifier */
    name: string;
    /** Compatibility status */
    status: CompatibilityStatus;
    /** Notes about compatibility */
    notes?: string;
    /** Additional metadata as key-value pairs */
    [key: string]: string | CompatibilityStatus | undefined;
}

interface CompatibilityTableProps {
    /** Table title */
    title?: string;
    /** Array of compatibility data */
    data: CompatibilityItem[];
    /** Columns to display (besides name and status) */
    columns?: string[];
    /** Enable local search */
    searchable?: boolean;
    /** Filters configuration */
    filters?: {
        key: string;
        label: string;
        options: string[];
    }[];
    /** Additional CSS classes */
    className?: string;
}

const statusConfig: Record<
    CompatibilityStatus,
    { icon: typeof Check; label: string; class: string }
> = {
    compatible: {
        icon: Check,
        label: 'Compatível',
        class: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
    },
    partial: {
        icon: AlertCircle,
        label: 'Parcial',
        class: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border border-yellow-500/20',
    },
    incompatible: {
        icon: X,
        label: 'Incompatível',
        class: 'text-destructive bg-destructive/10 border border-destructive/20',
    },
    unknown: {
        icon: AlertCircle,
        label: 'Desconhecido',
        class: 'text-muted-foreground bg-muted border border-border',
    },
};

/**
 * Filterable and searchable compatibility table for firmware, SD cards, etc.
 *
 * @example
 * ```mdx
 * <CompatibilityTable
 *   title="Compatibilidade de Cartões SD"
 *   data={[
 *     { name: 'SanDisk Ultra 64GB', status: 'compatible', speed: 'U1' },
 *     { name: 'Samsung EVO 128GB', status: 'compatible', speed: 'U3' },
 *   ]}
 *   columns={['speed']}
 *   searchable
 * />
 * ```
 */
export function CompatibilityTable({
    title,
    data,
    columns = [],
    searchable = true,
    filters = [],
    className,
}: CompatibilityTableProps) {
    const [search, setSearch] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

    const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    }, []);

    const handleFilterChange = useCallback(
        (key: string) => (e: ChangeEvent<HTMLSelectElement>) => {
            setActiveFilters((prev) => ({
                ...prev,
                [key]: e.target.value,
            }));
        },
        []
    );

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                const matchesSearch =
                    item.name.toLowerCase().includes(searchLower) ||
                    item.notes?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Active filters
            for (const [key, value] of Object.entries(activeFilters)) {
                if (value && item[key] !== value) return false;
            }

            return true;
        });
    }, [data, search, activeFilters]);

    return (
        <div className={cn('my-6', className)}>
            {title && (
                <h4 className="font-semibold text-lg text-foreground mb-4">
                    {title}
                </h4>
            )}

            {/* Search and Filters */}
            {(searchable || filters.length > 0) && (
                <div className="flex flex-wrap gap-3 mb-4">
                    {searchable && (
                        <div className="relative flex-1 min-w-[200px]">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                placeholder="Buscar..."
                                value={search}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label="Buscar na tabela"
                            />
                        </div>
                    )}

                    {filters.map((filter) => (
                        <select
                            key={filter.key}
                            value={activeFilters[filter.key] ?? ''}
                            onChange={handleFilterChange(filter.key)}
                            className="px-3 py-2 text-sm rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label={filter.label}
                        >
                            <option value="">{filter.label}</option>
                            {filter.options.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-foreground">
                                Nome
                            </th>
                            <th className="px-4 py-3 text-center font-semibold text-foreground">
                                Status
                            </th>
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-4 py-3 text-left font-semibold text-foreground capitalize"
                                >
                                    {col}
                                </th>
                            ))}
                            <th className="px-4 py-3 text-left font-semibold text-foreground">
                                Notas
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3 + columns.length}
                                    className="px-4 py-8 text-center text-muted-foreground"
                                >
                                    Nenhum item encontrado.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((item, index) => {
                                const status = statusConfig[item.status];
                                const StatusIcon = status.icon;

                                return (
                                    <tr
                                        key={index}
                                        className="hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {item.name}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border',
                                                    status.class
                                                )}
                                            >
                                                <StatusIcon className="size-3.5" aria-hidden="true" />
                                                {status.label}
                                            </span>
                                        </td>
                                        {columns.map((col) => (
                                            <td
                                                key={col}
                                                className="px-4 py-3 text-muted-foreground"
                                            >
                                                {item[col] ?? '-'}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {item.notes ?? '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Results count */}
            <p className="mt-3 text-xs text-muted-foreground">
                Exibindo {filteredData.length} de {data.length} itens
            </p>
        </div>
    );
}
