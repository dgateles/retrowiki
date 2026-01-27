'use client';

import {
    Store,
    ShoppingCart,
    CreditCard,
    Shield,
    AlertTriangle,
    ExternalLink,
    Check,
    X,
    Lightbulb,
    HardDrive,
    Wifi,
    Package,
    Star,
    BadgeCheck,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type TrustLevel = 'verified' | 'trusted' | 'caution' | 'choice';
type AccessoryCategory = 'storage' | 'connectivity' | 'protection' | 'other';

interface StoreItem {
    /** Store name */
    name: string;
    /** Description or notes about the store */
    description: string;
    /** Affiliate link URL */
    href: string;
    /** Trust level badge */
    trustLevel?: TrustLevel;
    /** Optional badge text (e.g., "Recomendado", "Choice") */
    badge?: string;
}

interface AccessoryItem {
    /** Accessory name */
    name: string;
    /** Description */
    description: string;
    /** Affiliate link URL */
    href: string;
    /** Category for grouping */
    category: AccessoryCategory;
    /** Optional highlight badge */
    badge?: string;
}

interface BuyingTip {
    /** Tip title */
    title: string;
    /** Tip description */
    description: string;
    /** Type of tip (positive or negative warning) */
    type: 'tip' | 'warning';
}

interface BuyingGuideProps {
    /** Console name for display */
    consoleName: string;
    /** Expected price range text */
    priceRange?: string;
    /** List of recommended stores */
    stores?: StoreItem[];
    /** List of recommended accessories */
    accessories?: AccessoryItem[];
    /** Buying tips and warnings */
    tips?: BuyingTip[];
    /** Custom CSS classes */
    className?: string;
}

function getTrustLevelStyle(level: TrustLevel) {
    switch (level) {
        case 'verified':
            return {
                bg: 'bg-emerald-500/10',
                text: 'text-emerald-600 dark:text-emerald-400',
                border: 'border-emerald-500/30',
                icon: BadgeCheck,
                label: 'Verificado',
            };
        case 'trusted':
            return {
                bg: 'bg-blue-500/10',
                text: 'text-blue-600 dark:text-blue-400',
                border: 'border-blue-500/30',
                icon: Star,
                label: 'Confiável',
            };
        case 'caution':
            return {
                bg: 'bg-yellow-500/10',
                text: 'text-yellow-600 dark:text-yellow-400',
                border: 'border-yellow-500/30',
                icon: AlertTriangle,
                label: 'Atenção',
            };
    }
}

function getCategoryInfo(category: AccessoryCategory) {
    switch (category) {
        case 'storage':
            return { icon: HardDrive, label: 'Armazenamento' };
        case 'connectivity':
            return { icon: Wifi, label: 'Conectividade' };
        case 'protection':
            return { icon: Shield, label: 'Proteção' };
        case 'other':
            return { icon: Package, label: 'Outros' };
    }
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
    return (
        <div className="mb-4">
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{title}</span>
            </h3>
            {subtitle && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-7">{subtitle}</p>
            )}
        </div>
    );
}

function StoreCard({ store }: { store: StoreItem }) {
    const trustStyle = store.trustLevel ? getTrustLevelStyle(store.trustLevel) : null;
    const TrustIcon = trustStyle?.icon;

    return (
        <a
            href={store.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {store.name}
                    </h4>
                    {trustStyle && TrustIcon && (
                        <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
                            trustStyle.bg, trustStyle.text, trustStyle.border
                        )}>
                            <TrustIcon className="w-3 h-3" />
                            {trustStyle.label}
                        </span>
                    )}
                    {store.badge && (
                        <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium border',
                            store.badge.toLowerCase() === 'brasil'
                                ? 'bg-linear-to-r from-teal-500/20 to-yellow-400/20 text-teal-600 dark:text-teal-300 border-teal-500/30 dark:border-teal-400/30'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        )}>
                            {store.badge.toLowerCase() === 'brasil' ? '🇧🇷 No Brasil' : store.badge}
                        </span>
                    )}
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{store.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all ml-4 shrink-0" />
        </a>
    );
}

function AccessoryCard({ accessory }: { accessory: AccessoryItem }) {
    const categoryInfo = getCategoryInfo(accessory.category);
    const CategoryIcon = categoryInfo.icon;

    return (
        <a
            href={accessory.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
        >
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-emerald-500/10 transition-colors shrink-0">
                <CategoryIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {accessory.name}
                    </h4>
                    {accessory.badge && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {accessory.badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{accessory.description}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
        </a>
    );
}

function TipCard({ tip }: { tip: BuyingTip }) {
    const isWarning = tip.type === 'warning';

    return (
        <div className={cn(
            'flex items-start gap-3 p-3 rounded-lg border',
            isWarning
                ? 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50'
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
        )}>
            <div className={cn(
                'p-1.5 rounded-md shrink-0',
                isWarning
                    ? 'bg-yellow-500/10'
                    : 'bg-emerald-500/10'
            )}>
                {isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                ) : (
                    <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
            </div>
            <div>
                <h4 className={cn(
                    'font-medium text-sm',
                    isWarning
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-emerald-700 dark:text-emerald-300'
                )}>
                    {tip.title}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{tip.description}</p>
            </div>
        </div>
    );
}

/**
 * Professional buying guide component with affiliate link support.
 *
 * @example
 * ```mdx
 * <BuyingGuide
 *   consoleName="R36S"
 *   priceRange="R$ 200 - R$ 280"
 *   stores={[
 *     { name: "BOYHOM Store", description: "Vendedor confiável", href: "...", trustLevel: "verified" }
 *   ]}
 *   accessories={[
 *     { name: "Samsung Pro Plus", description: "Alta compatibilidade", href: "...", category: "storage" }
 *   ]}
 *   tips={[
 *     { title: "Verifique Avaliações", description: "Olhe as fotos dos comentários", type: "tip" }
 *   ]}
 * />
 * ```
 */
export function BuyingGuide({
    consoleName,
    priceRange,
    stores,
    accessories,
    tips,
    className,
}: BuyingGuideProps): React.ReactElement {
    // Group accessories by category
    const accessoriesByCategory = accessories?.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<AccessoryCategory, AccessoryItem[]>);

    const categoryOrder: AccessoryCategory[] = ['storage', 'connectivity', 'protection', 'other'];

    return (
        <div className={cn('space-y-6 not-prose !mt-0 [&>*:first-child]:!mt-0', className)}>
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-zinc-100 via-zinc-50 to-emerald-50/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/30 border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="!m-0 text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                            Guia de Compras - {consoleName}
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-snug">
                            Lojas confiáveis, acessórios recomendados e dicas de compra
                        </p>
                    </div>
                </div>
                {priceRange && (
                    <div className="mt-3 ml-[46px] flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            Faixa de preço esperada: <strong className="text-zinc-900 dark:text-zinc-100">{priceRange}</strong>
                        </span>
                    </div>
                )}
            </div>

            {/* Stores Section */}
            {stores && stores.length > 0 && (
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <SectionHeader
                        icon={Store}
                        title="Lojas Recomendadas"
                        subtitle="Vendedores com histórico positivo na comunidade"
                    />
                    <div className="space-y-3">
                        {stores.map((store, index) => (
                            <StoreCard key={index} store={store} />
                        ))}
                    </div>
                </div>
            )}

            {/* Accessories Section */}
            {accessoriesByCategory && Object.keys(accessoriesByCategory).length > 0 && (
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <SectionHeader
                        icon={Package}
                        title="Acessórios Essenciais"
                        subtitle="Itens recomendados para melhorar sua experiência"
                    />
                    <div className="space-y-6">
                        {categoryOrder.map((category) => {
                            const items = accessoriesByCategory[category];
                            if (!items || items.length === 0) return null;

                            const categoryInfo = getCategoryInfo(category);

                            return (
                                <div key={category}>
                                    <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide mb-3">
                                        <categoryInfo.icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>{categoryInfo.label}</span>
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {items.map((accessory, index) => (
                                            <AccessoryCard key={index} accessory={accessory} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tips Section */}
            {tips && tips.length > 0 && (
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <SectionHeader
                        icon={Lightbulb}
                        title="Dicas de Compra"
                        subtitle="Informações importantes antes de comprar"
                    />
                    <div className="space-y-3">
                        {tips.map((tip, index) => (
                            <TipCard key={index} tip={tip} />
                        ))}
                    </div>
                </div>
            )}

            {/* Footer disclaimer */}
            <div className="text-xs text-zinc-400 dark:text-zinc-500 text-center px-4">
                Os links desta página podem conter códigos de afiliados. Ao comprar através deles, você ajuda a manter o projeto sem custo adicional.
            </div>
        </div>
    );
}

export default BuyingGuide;
