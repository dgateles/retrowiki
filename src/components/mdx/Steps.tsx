import type { ReactNode, ReactElement } from 'react';
import { Children, isValidElement } from 'react';
import { cn } from '@/lib/cn';

interface StepsProps {
    /** Step children */
    children: ReactNode;
    /** Additional CSS classes */
    className?: string;
}

interface StepProps {
    /** Step title */
    title: string;
    /** Step content */
    children: ReactNode;
    /** Optional time estimate */
    time?: string;
    /** Optional risk level */
    risk?: 'low' | 'medium' | 'high';
    /** Additional CSS classes */
    className?: string;
}

const riskConfig = {
    low: { label: 'Risco Baixo', class: 'rw-badge-success' },
    medium: { label: 'Risco Médio', class: 'rw-badge-warning' },
    high: { label: 'Risco Alto', class: 'rw-badge-error' },
};

/**
 * Container for step-by-step guides with visual connectors.
 *
 * @example
 * ```mdx
 * <Steps>
 *   <Step title="Baixar firmware" time="2 min">
 *     Acesse a página oficial de downloads...
 *   </Step>
 *   <Step title="Formatar cartão SD" time="5 min" risk="medium">
 *     Formate o cartão usando o formato FAT32...
 *   </Step>
 * </Steps>
 * ```
 */
export function Steps({ children, className }: StepsProps) {
    const steps = Children.toArray(children).filter(
        (child): child is ReactElement<StepProps> =>
            isValidElement(child) && child.type === Step
    );

    return (
        <div className={cn('my-8 not-prose', className)}>
            <ol className="relative space-y-6 list-none pl-0 m-0">
                {steps.map((step, index) => {
                    const { title, children: content, time, risk, className: stepClassName } =
                        step.props;
                    const isLast = index === steps.length - 1;

                    return (
                        <li key={index} className="relative list-none ml-0 pl-0">
                            {/* Step row with circle and content */}
                            <div className="flex gap-4">
                                {/* Step number circle */}
                                <div className="relative shrink-0">
                                    <div
                                        className="flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--rw-accent))] text-white dark:text-zinc-800 font-semibold text-sm"
                                    >
                                        {index + 1}
                                    </div>
                                    {/* Connector line */}
                                    {!isLast && (
                                        <div
                                            className="absolute left-1/2 top-8 bottom-0 w-0.5 -translate-x-1/2 bg-[hsl(var(--rw-border))]"
                                            style={{ height: 'calc(100% + 1.5rem)' }}
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>

                                {/* Content */}
                                <div className={cn('flex-1', stepClassName)}>
                                    {/* Step header - title on its own line */}
                                    <div className="flex flex-wrap items-center gap-2 h-8">
                                        <span className="font-bold text-lg text-foreground dark:text-zinc-300">
                                            {title}
                                        </span>
                                        {time && (
                                            <span className="rw-badge rw-badge-secondary dark:text-zinc-300">
                                                {time}
                                            </span>
                                        )}
                                        {risk && (
                                            <span className={cn('rw-badge', riskConfig[risk].class)}>
                                                {riskConfig[risk].label}
                                            </span>
                                        )}
                                    </div>

                                    {/* Step content - separate from title */}
                                    <div className="text-muted-foreground text-sm leading-relaxed mt-2 dark:text-zinc-300">
                                        {content}
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/**
 * Individual step within a Steps container.
 * Must be used as a direct child of Steps.
 */
export function Step(_props: StepProps) {
    // This component is only used for type inference
    // The actual rendering is handled by the Steps component
    return null;
}
