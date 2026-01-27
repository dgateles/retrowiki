'use client';

import { useState, useEffect } from 'react';
import { Download, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FirmwareSource {
    /** Display name of the firmware */
    name: string;
    /** GitHub owner (user or organization) — required for GitHub-hosted firmwares */
    owner?: string;
    /** GitHub repository name — required for GitHub-hosted firmwares */
    repo?: string;
    /** External website URL — for firmwares not hosted on GitHub */
    website?: string;
    /** Optional description */
    description?: string;
    /** Optional icon/emoji */
    icon?: string;
    /** Mark firmware as deprecated/obsolete */
    deprecated?: boolean;
}

interface FirmwareListProps {
    /** Array of firmware sources to display */
    items: FirmwareSource[];
    /** Additional CSS classes */
    className?: string;
}

interface ReleaseData {
    version: string;
    name: string;
    date: string;
    url: string;
    downloadUrl: string | null;
    size: string | null;
}

interface FirmwareState {
    loading: boolean;
    error: string | null;
    data: ReleaseData | null;
}

/**
 * Dynamic firmware list that fetches latest release info from GitHub.
 * Also supports external websites for firmwares not hosted on GitHub.
 *
 * @example
 * ```mdx
 * <FirmwareList
 *   items={[
 *     { name: "ArkOS", owner: "christianhaitian", repo: "arkos" },
 *     { name: "muOS", website: "https://muos.dev/devices", description: "..." },
 *   ]}
 * />
 * ```
 */
export function FirmwareList({ items, className }: FirmwareListProps): React.ReactElement {
    const [firmwareStates, setFirmwareStates] = useState<Map<string, FirmwareState>>(new Map());

    function formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    }

    function formatDate(isoDate: string): string {
        try {
            const date = new Date(isoDate);
            return date.toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
        } catch (e) {
            return isoDate;
        }
    }

    useEffect(() => {
        const fetchReleases = async (): Promise<void> => {
            const initialStates = new Map<string, FirmwareState>();
            const githubItems = items.filter((item) => item.owner && item.repo);
            githubItems.forEach((item) => {
                initialStates.set(`${item.owner}/${item.repo}`, {
                    loading: true,
                    error: null,
                    data: null,
                });
            });
            setFirmwareStates(new Map(initialStates));

            await Promise.all(
                githubItems.map(async (item) => {
                    const key = `${item.owner}/${item.repo}`;
                    try {
                        // Fetch directly from GitHub API
                        let response = await fetch(
                            `https://api.github.com/repos/${item.owner}/${item.repo}/releases/latest`
                        );

                        if (!response.ok) {
                            // Try listing all releases if latest fails
                            response = await fetch(
                                `https://api.github.com/repos/${item.owner}/${item.repo}/releases`
                            );
                        }

                        if (!response.ok) {
                            throw new Error('Failed to fetch release');
                        }

                        const json = await response.json();
                        let release = Array.isArray(json) ? json[0] : json;

                        if (!release) throw new Error('No release found');

                        // If it was a list fetch, ensure we have the first one
                        if (Array.isArray(json)) {
                            if (json.length === 0) throw new Error('No releases');
                            release = json[0];
                        }

                        const assets = release.assets || [];
                        const mainAsset = assets.find(
                            (a: any) =>
                                a.name.endsWith('.img.gz') ||
                                a.name.endsWith('.img.xz') ||
                                a.name.endsWith('.img') ||
                                a.name.endsWith('.zip')
                        );

                        const data: ReleaseData = {
                            version: release.tag_name,
                            name: release.name || release.tag_name,
                            date: formatDate(release.published_at),
                            url: release.html_url,
                            downloadUrl: mainAsset?.browser_download_url || release.html_url,
                            size: mainAsset ? formatBytes(mainAsset.size) : null,
                        };

                        setFirmwareStates((prev) => {
                            const next = new Map(prev);
                            next.set(key, { loading: false, error: null, data });
                            return next;
                        });
                    } catch (err) {
                        setFirmwareStates((prev) => {
                            const next = new Map(prev);
                            next.set(key, {
                                loading: false,
                                error: 'Não foi possível carregar',
                                data: null,
                            });
                            return next;
                        });
                    }
                })
            );
        };

        fetchReleases();
    }, [items]);

    return (
        <div className={cn('my-6 space-y-4 not-prose', className)}>
            {items.map((item, index) => {
                const isGitHub = item.owner && item.repo;
                const key = isGitHub ? `${item.owner}/${item.repo}` : `website-${index}`;
                const state = isGitHub
                    ? firmwareStates.get(key) || { loading: true, error: null, data: null }
                    : { loading: false, error: null, data: null };

                return (
                    <div
                        key={key}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <h4 className="font-semibold text-foreground text-lg">{item.name}</h4>
                                {item.deprecated && (
                                    <span className="px-2 py-0.5 text-xs rounded bg-red-500/10 text-red-600 border border-red-500/20">
                                        Obsoleto
                                    </span>
                                )}
                                {isGitHub && state.loading ? (
                                    <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground animate-pulse">
                                        ...
                                    </span>
                                ) : state.data ? (
                                    <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        {state.data.version}
                                    </span>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                {isGitHub && state.loading ? (
                                    <span className="flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Carregando...
                                    </span>
                                ) : isGitHub && state.error ? (
                                    <span className="flex items-center gap-1 text-destructive">
                                        <AlertCircle className="w-3 h-3" />
                                        {state.error}
                                    </span>
                                ) : state.data ? (
                                    <span>Lançado em {state.data.date}</span>
                                ) : !isGitHub && item.website ? (
                                    <span>Download disponível no site oficial</span>
                                ) : null}
                            </div>

                            {item.description && (
                                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                            {isGitHub && state.data && (
                                <a
                                    href={state.data.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rw-btn dark:bg-transparent! dark:border-green-500/20! border! hover:bg-green-100/20 dark:hover:bg-green-100/5!"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </a>
                            )}
                            {!isGitHub && item.website && (
                                <a
                                    href={item.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rw-btn dark:bg-transparent! dark:border-green-500/20! border! hover:bg-green-100/20 dark:hover:bg-green-100/5!"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Site Oficial
                                </a>
                            )}
                            {isGitHub && (
                                <a
                                    href={`https://github.com/${item.owner}/${item.repo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-none!"
                                    title="Ver repositório no GitHub"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default FirmwareList;
