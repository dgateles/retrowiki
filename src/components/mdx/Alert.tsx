import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

/**
 * Alert severity types for different use cases.
 */
type AlertType = 'critical' | 'warning' | 'info' | 'success';

interface AlertProps {
    type: AlertType;
    title?: string;
    children: ReactNode;
    className?: string;
}

const alertStyles: Record<AlertType, string> = {
    critical: 'bg-red-200 border-red-300 text-red-950 dark:bg-red-900/40 dark:border-red-800 dark:text-red-100',
    warning: 'bg-amber-200 border-amber-300 text-amber-950 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-100',
    info: 'bg-blue-200 border-blue-300 text-blue-950! dark:bg-blue-900/40! dark:border-blue-800! dark:text-blue-100!',
    success: 'bg-emerald-200 border-emerald-300 text-emerald-950 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-100',
};

const alertTextStyles: Record<AlertType, string> = {
    critical: 'text-red-950! dark:text-red-100!',
    warning: 'text-amber-950! dark:text-amber-100!',
    info: 'text-blue-950! dark:text-blue-100!',
    success: 'text-emerald-950! dark:text-emerald-100!',
};

const alertLabels: Record<AlertType, string> = {
    critical: 'Atenção Crítica',
    warning: 'Aviso',
    info: 'Informação',
    success: 'Sucesso',
};

const IconComponents = {
    critical: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle,
};

/**
 * Custom styled Alert component for Retro Wiki.
 */
export function Alert({ type, title, children, className = '' }: AlertProps) {
    const styleClass = alertStyles[type];
    const styleTextClass = alertTextStyles[type];
    const Icon = IconComponents[type];
    const displayTitle = title ?? alertLabels[type];

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg border-l-4 my-6 not-prose ${styleClass} ${className}`}
            role="alert"
        >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
                <p className={`font-semibold leading-relaxed m-0 text-inherit ${styleTextClass} ${className}`}>
                    {displayTitle}
                </p>
                <div className={`text-sm mt-1 text-inherit/90 [&>p]:my-1 ${styleTextClass} ${className}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}
