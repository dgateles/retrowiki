'use client';

import { Check, X, Monitor, Gamepad2, Cpu, Wifi, ThumbsUp, ThumbsDown, Joystick, Settings } from 'lucide-react';
import Image from 'next/image';

type EmulationLevel = 'excellent' | 'good' | 'playable' | 'poor';

interface EmulationItem {
    system: string;
    level: EmulationLevel;
}

interface ConsoleOverviewProps {
    name: string;
    manufacturer: string;
    description: string;
    image: string;
    releaseYear?: number;
    priceRange?: string;
    screen: {
        aspectRatio: string;
        size: string;
        resolution: string;
        refreshRate: string;
        type: string;
    };
    ergonomics?: {
        hasGrip?: boolean;
        hasCooling?: boolean;
        hasVibration?: boolean;
        speakerPlacement?: string;
        chargePortPlacement?: string;
    };
    connectivity?: {
        hasWifi?: boolean;
        hasBluetooth?: boolean;
        hasAudioJack?: boolean;
        hasStereoSpeaker?: boolean;
        hasVideoOut?: boolean;
        hasUsbC?: boolean;
        hasSdCard?: boolean;
    };
    controls?: {
        hasL1R1?: boolean;
        hasL2R2?: boolean;
        hasAnalogTriggers?: boolean;
        hasAnalogSticks?: boolean;
        hasHallEffect?: boolean;
        hasL3R3?: boolean;
        hasTouchScreen?: boolean;
        hasGyroscope?: boolean;
        hasVolumeButtons?: boolean;
    };
    specs: {
        cpu: string;
        gpu?: string;
        ram: string;
        ramType?: string;
        architecture?: string;
        storage?: string;
        battery?: string;
        os?: string;
        formFactor?: string;
    };
    emulation?: EmulationItem[];
    pros?: string[];
    cons?: string[];
}

function getEmulationColors(level: EmulationLevel) {
    switch (level) {
        case 'excellent':
            return { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' };
        case 'good':
            return { bg: 'bg-yellow-500/15', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' };
        case 'playable':
            return { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' };
        case 'poor':
            return { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' };
    }
}

function getEmulationLabel(level: EmulationLevel): string {
    switch (level) {
        case 'excellent': return 'Excelente';
        case 'good': return 'Bom';
        case 'playable': return 'Jogável';
        case 'poor': return 'Ruim';
    }
}

function EmulationBadge({ system, level }: EmulationItem) {
    const colors = getEmulationColors(level);
    return (
        <div className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs border ${colors.bg} ${colors.border}`}>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{system}</span>
            <span className={`font-semibold ${colors.text}`}>{getEmulationLabel(level)}</span>
        </div>
    );
}

function FeatureBadge({ label, available }: { label: string; available: boolean }) {
    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border ${available
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700/50'
            }`}>
            {available ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>{label}</span>
        </div>
    );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
    return (
        <h3 className="inline-flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3 mt-0!">
            <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{title}</span>
        </h3>
    );
}

function InlineSectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
    return (
        <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide mb-2">
            <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{title}</span>
        </h4>
    );
}

function SpecRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-zinc-200 dark:border-zinc-800/50 last:border-0">
            <span className="text-zinc-500 dark:text-zinc-400 text-xs">{label}</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium text-xs text-right">{value}</span>
        </div>
    );
}

function Divider() {
    return <hr className="border-zinc-200 dark:border-zinc-700 my-4 mb-2! mt-2!" />;
}

export function ConsoleOverview({
    name, manufacturer, description, image, releaseYear, priceRange,
    screen, ergonomics, connectivity, controls, specs, emulation, pros, cons,
}: ConsoleOverviewProps) {
    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-zinc-100 via-zinc-50 to-emerald-50/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/30 border border-zinc-200 dark:border-zinc-800 p-5">
                <div className="flex flex-col md:flex-row gap-5 items-center">
                    <div className="relative w-48 h-48 md:w-56 md:h-56 shrink-0 flex items-center justify-center">
                        <div className="absolute inset-0 bg-linear-to-br dark:from-emerald-500/10 dark:to-blue-500/10 from-emerald-300/5 to-blue-300/5 blur-xl" />
                        <Image
                            src={image}
                            alt={name}
                            width={200}
                            height={200}
                            className="object-contain relative z-10 drop-shadow-lg max-w-full max-h-full border-0!"
                            priority
                        />
                    </div>
                    <div className="flex-1 text-center md:text-left flex flex-col justify-center">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{manufacturer}</span>
                            {releaseYear && (
                                <>
                                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{releaseYear}</span>
                                </>
                            )}
                            {priceRange && (
                                <>
                                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                    <a href='buying-guide/' className="text-xs text-zinc-500 dark:text-zinc-400">{priceRange}</a>
                                </>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{name}</h1>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{description}</p>
                    </div>
                </div>
            </div>

            {/* Emulation Performance */}
            {emulation && emulation.length > 0 && (
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <SectionHeader icon={Joystick} title="Desempenho de Emulação" />
                    <div className="flex flex-wrap gap-3 text-xs mb-3">
                        <div className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-500/60" />
                            <span className="text-zinc-500 dark:text-zinc-400">Excelente</span>
                        </div>
                        <div className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40 border border-yellow-500/60" />
                            <span className="text-zinc-500 dark:text-zinc-400">Bom</span>
                        </div>
                        <div className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-500/40 border border-orange-500/60" />
                            <span className="text-zinc-500 dark:text-zinc-400">Jogável</span>
                        </div>
                        <div className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500/40 border border-red-500/60" />
                            <span className="text-zinc-500 dark:text-zinc-400">Ruim</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                        {emulation.map((item, index) => (
                            <EmulationBadge key={index} system={item.system} level={item.level} />
                        ))}
                    </div>
                </div>
            )}

            {/* Specifications */}
            <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <SectionHeader icon={Settings} title="Especificações Técnicas" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Left Column */}
                    <div>
                        <InlineSectionHeader icon={Monitor} title="Tela" />
                        <SpecRow label="Proporção" value={screen.aspectRatio} />
                        <SpecRow label="Tamanho" value={screen.size} />
                        <SpecRow label="Resolução" value={screen.resolution} />
                        <SpecRow label="Taxa" value={screen.refreshRate} />
                        <SpecRow label="Painel" value={screen.type} />
                    </div>

                    {/* Right Column */}
                    <div>
                        <InlineSectionHeader icon={Cpu} title="Hardware" />
                        <SpecRow label="CPU" value={specs.cpu} />
                        {specs.gpu && <SpecRow label="GPU" value={specs.gpu} />}
                        <SpecRow label="RAM" value={specs.ram} />
                        {specs.storage && <SpecRow label="Armazenamento" value={specs.storage} />}
                        {specs.battery && <SpecRow label="Bateria" value={specs.battery} />}
                        {specs.os && <SpecRow label="Sistema" value={specs.os} />}
                    </div>
                </div>
                <Divider />
                <div className='grid grid-cols-1 gap-x-6 gap-y-4'>
                    {connectivity && (
                        <div className="mb-4">
                            <InlineSectionHeader icon={Wifi} title="Conectividade" />
                            <div className="grid grid-cols-2 gap-1.5">
                                <FeatureBadge label="Wi-Fi" available={connectivity.hasWifi ?? false} />
                                <FeatureBadge label="Bluetooth" available={connectivity.hasBluetooth ?? false} />
                                <FeatureBadge label="P2 Áudio" available={connectivity.hasAudioJack ?? false} />
                                <FeatureBadge label="USB-C" available={connectivity.hasUsbC ?? false} />
                                <FeatureBadge label="Vídeo Out" available={connectivity.hasVideoOut ?? false} />
                                <FeatureBadge label="SD Card" available={connectivity.hasSdCard ?? false} />
                            </div>
                        </div>
                    )}
                    <Divider />
                    {controls && (
                        <div className="mb-4">
                            <InlineSectionHeader icon={Gamepad2} title="Controles" />
                            <div className="grid grid-cols-2 gap-1.5">
                                <FeatureBadge label="L1/R1" available={controls.hasL1R1 ?? false} />
                                <FeatureBadge label="L2/R2" available={controls.hasL2R2 ?? false} />
                                <FeatureBadge label="Analógicos" available={controls.hasAnalogSticks ?? false} />
                                <FeatureBadge label="L3/R3" available={controls.hasL3R3 ?? false} />
                                <FeatureBadge label="Touch" available={controls.hasTouchScreen ?? false} />
                                <FeatureBadge label="Gyro" available={controls.hasGyroscope ?? false} />
                            </div>
                        </div>
                    )}
                    <Divider />
                    {ergonomics && (
                        <div>
                            <InlineSectionHeader icon={Gamepad2} title="Ergonomia" />
                            <div className="grid grid-cols-2 gap-1.5">
                                <FeatureBadge label="Grip" available={ergonomics.hasGrip ?? false} />
                                <FeatureBadge label="Cooling" available={ergonomics.hasCooling ?? false} />
                                <FeatureBadge label="Vibração" available={ergonomics.hasVibration ?? false} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pros and Cons */}
            {(pros?.length || cons?.length) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pros && pros.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                            <SectionHeader icon={ThumbsUp} title="Pontos Positivos" />
                            <ul className="space-y-1.5">
                                {pros.map((pro, index) => (
                                    <li key={index} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                        <span>{pro}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {cons && cons.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                            <SectionHeader icon={ThumbsDown} title="Pontos Negativos" />
                            <ul className="space-y-1.5">
                                {cons.map((con, index) => (
                                    <li key={index} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                        <X className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                                        <span>{con}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
