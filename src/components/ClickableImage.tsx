'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ClickableImageProps {
    src: string;
    alt: string;
    caption?: string;
    className?: string;
}

export function ClickableImage({ src, alt, caption, className }: ClickableImageProps) {
    const [isOpen, setIsOpen] = useState(false);

    const openModal = useCallback(() => setIsOpen(true), []);
    const closeModal = useCallback(() => setIsOpen(false), []);

    // Close on ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, closeModal]);

    return (
        <>
            {/* Thumbnail */}
            <figure className={cn('group relative cursor-pointer', className)}>
                <div
                    className="relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-colors"
                    onClick={openModal}
                >
                    <Image
                        src={src}
                        alt={alt}
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/50 rounded-full">
                            <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
                {caption && (
                    <figcaption className="mt-2 text-sm text-center text-zinc-500 dark:text-zinc-400">
                        {caption}
                    </figcaption>
                )}
            </figure>

            {/* Modal/Lightbox */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <button
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                        onClick={closeModal}
                        aria-label="Fechar"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div
                        className="relative max-w-[90vw] max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={src}
                            alt={alt}
                            width={1920}
                            height={1080}
                            className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg"
                            priority
                        />
                        {caption && (
                            <p className="mt-3 text-center text-white/80 text-sm">
                                {caption}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default ClickableImage;
