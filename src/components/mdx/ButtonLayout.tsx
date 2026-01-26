'use client';

import React from 'react';
import { cn } from '@/lib/cn';

interface ButtonLayoutProps {
    className?: string;
}

/**
 * Visual representation of the R36S button layout
 * Displays the console controls in an interactive diagram
 */
export function ButtonLayout({ className }: ButtonLayoutProps): React.ReactElement {
    return (
        <div className={cn('not-prose my-6', className)}>
            <div
                className="relative mx-auto rounded-2xl p-6 max-w-md"
                style={{
                    background: 'linear-gradient(145deg, #2a2a3a 0%, #1a1a2a 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                {/* Console body */}
                <div className="flex flex-col gap-6">
                    {/* Shoulder buttons */}
                    <div className="flex justify-between px-2">
                        <div className="flex gap-2">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-3 rounded-t-lg bg-gray-600" title="L1" />
                                <span className="text-[8px] text-gray-500">L1</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-3 rounded-t-lg bg-gray-500" title="L2" />
                                <span className="text-[8px] text-gray-500">L2</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-3 rounded-t-lg bg-gray-500" title="R2" />
                                <span className="text-[8px] text-gray-500">R2</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-3 rounded-t-lg bg-gray-600" title="R1" />
                                <span className="text-[8px] text-gray-500">R1</span>
                            </div>
                        </div>
                    </div>
                    {/* Screen area */}
                    <div
                        className="mx-auto w-98 h-42 rounded-lg flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(180deg, #0a0a12 0%, #151520 100%)',
                            border: '2px solid #333',
                        }}
                    >
                        <span className="text-gray-500 text-xs">TELA</span>
                    </div>

                    {/* Controls area */}
                    <div className="flex justify-between items-center px-2">
                        {/* Left side - D-Pad */}
                        <div className="flex flex-col items-center gap-2">
                            {/* D-Pad */}
                            <div className="relative w-20 h-20">
                                {/* Up */}
                                <div
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-700 rounded flex items-center justify-center text-[10px] text-gray-400"
                                    title="Cima"
                                />
                                {/* Down */}
                                <div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-700 rounded flex items-center justify-center text-[10px] text-gray-400"
                                    title="Baixo"
                                />
                                {/* Left */}
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-700 rounded flex items-center justify-center text-[10px] text-gray-400"
                                    title="Esquerda"
                                />
                                {/* Right */}
                                <div
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-700 rounded flex items-center justify-center text-[10px] text-gray-400"
                                    title="Direita"
                                />
                                {/* Center */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-800 rounded" />
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1">D-PAD</span>

                            {/* Left Analog */}
                            <div
                                className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center mt-2"
                                title="Analógico Esquerdo"
                            >
                                <div className="w-6 h-6 rounded-full bg-gray-800" />
                            </div>
                            <span className="text-[10px] text-gray-500">L3</span>
                        </div>

                        {/* Center - FN, SELECT, START */}
                        <div className="flex flex-col items-center gap-3">
                            {/* FN button */}
                            <div
                                className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[8px] text-gray-300 font-bold"
                                title="Função (Hotkey)"
                            >
                                FN
                            </div>

                            {/* SELECT and START */}
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div
                                        className="w-8 h-4 rounded-full bg-gray-600 flex items-center justify-center"
                                        title="Select"
                                    />
                                    <span className="text-[8px] text-gray-500 mt-1">SELECT</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div
                                        className="w-8 h-4 rounded-full bg-gray-600 flex items-center justify-center"
                                        title="Start"
                                    />
                                    <span className="text-[8px] text-gray-500 mt-1">START</span>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Face buttons */}
                        <div className="flex flex-col items-center gap-2">
                            {/* XYAB buttons */}
                            <div className="relative w-20 h-20">
                                {/* X - Top (Blue) */}
                                <div
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-gray-900"
                                    style={{ background: '#3b82f6' }}
                                    title="X"
                                >
                                    X
                                </div>
                                {/* B - Bottom (Green) */}
                                <div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-gray-900"
                                    style={{ background: '#eab308' }}
                                    title="B"
                                >
                                    B
                                </div>
                                {/* Y - Left (Yellow) */}
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-gray-900"
                                    style={{ background: '#22c55e' }}
                                    title="Y"
                                >
                                    Y
                                </div>
                                {/* A - Right (Red) */}
                                <div
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-gray-900"
                                    style={{ background: '#ef4444' }}
                                    title="A"
                                >
                                    A
                                </div>
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1">XYAB</span>

                            {/* Right Analog */}
                            <div
                                className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center mt-2"
                                title="Analógico Direito"
                            >
                                <div className="w-6 h-6 rounded-full bg-gray-800" />
                            </div>
                            <span className="text-[10px] text-gray-500">R3</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ButtonLayout;
