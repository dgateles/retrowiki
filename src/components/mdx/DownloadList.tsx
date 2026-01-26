import { Download, FileCheck, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DownloadItem {
    /** Download name/title */
    name: string;
    /** Version string */
    version: string;
    /** Download URL */
    url: string;
    /** File size (e.g., "256 MB") */
    size?: string;
    /** Optional SHA256 checksum */
    checksum?: string;
    /** Release date */
    date?: string;
    /** Optional changelog URL */
    changelogUrl?: string;
}

interface DownloadListProps {
    /** Array of download items */
    items: DownloadItem[];
    /** Additional CSS classes */
    className?: string;
}

/**
 * Download list component with version info, file sizes, and checksums.
 *
 * @example
 * ```mdx
 * <DownloadList
 *   items={[
 *     {
 *       name: 'ArkOS',
 *       version: '2.0.1',
 *       url: 'https://example.com/arkos.img.gz',
 *       size: '1.2 GB',
 *       checksum: 'abc123...',
 *       date: '2024-01-15',
 *     },
 *   ]}
 * />
 * ```
 */
export function DownloadList({ items, className }: DownloadListProps) {
    return (
        <div className={cn('my-6 space-y-4', className)}>
            {items.map((item, index) => (
                <div
                    key={index}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">
                                {item.name}
                            </h4>
                            <span className="rw-badge rw-badge-accent">{item.version}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {item.size && <span>{item.size}</span>}
                            {item.date && <span>Lançado em {item.date}</span>}
                            {item.changelogUrl && (
                                <a
                                    href={item.changelogUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                    <ExternalLink className="size-3" aria-hidden="true" />
                                    Changelog
                                </a>
                            )}
                        </div>

                        {item.checksum && (
                            <details className="mt-2 text-sm group">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                                    <FileCheck className="size-3" aria-hidden="true" />
                                    Verificar SHA256
                                </summary>
                                <code className="block mt-1 p-2 text-xs bg-muted/50 rounded-md font-mono break-all select-all text-muted-foreground">
                                    {item.checksum}
                                </code>
                            </details>
                        )}
                    </div>

                    <a
                        href={item.url}
                        className="rw-btn rw-btn-primary whitespace-nowrap"
                        download
                    >
                        <Download className="size-4 mr-2" aria-hidden="true" />
                        Download
                    </a>
                </div>
            ))}
        </div>
    );
}
