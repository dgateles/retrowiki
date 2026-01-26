'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Search, Upload, CheckCircle, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Device configuration entry for DTB detection
 */
interface DeviceConfig {
    name: string;
    md5: string[];
    panelInitSequence: string;
    resetGpios: string | null;
    enableGpios: string | null;
}

/**
 * Complete device database - uses unique distinguishing byte sequences
 * Panel 4 vs V22 difference: Panel 4 ends with "15 00 02 11 00 15 00 02 29 00", V22 ends with "15 00 02 36 02"
 */
const DEVICE_DATABASE: DeviceConfig[] = [
    // GameConsole R36S variants - using unique ending sequences to distinguish
    { name: 'GameConsole R36s Panel 0', md5: ['bfc6068ef7d80575bef04b36ef881619'], panelInitSequence: '39 00 04 b9 f1 12 83 39 00 06 b1 00 00 00 da 80 39 00 04 b2 00 13 70', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: null },
    { name: 'GameConsole R36s Panel 1', md5: ['a3d55922b4ccce3e2b23c57cefdd9ba7'], panelInitSequence: '39 00 03 e0 ab ba 39 00 03 e1 ba ab', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: null },
    { name: 'GameConsole R36s Panel 2', md5: ['a5d6f30491abac29423d0c1334ad88d3'], panelInitSequence: '15 00 02 ff 30 15 00 02 ff 52 15 00 02 ff 01 15 00 02 e3 00 15 00 02 40 0a 15 00 02 03 40', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: null },
    { name: 'GameConsole R36s Panel 3', md5: ['b3bf18765a4453b8eaeaf60362b79b3d'], panelInitSequence: '15 00 02 ff 30 15 00 02 ff 52 15 00 02 ff 01 15 00 02 e3 00 15 00 02 04 00 15 00 02 05 03', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: null },
    // Panel 4 has "11 00" and "29 00" commands before final sequence
    { name: 'GameConsole R36s Panel 4', md5: ['42a3021377abadd36375e62a7d5a2e40', '9f41df45acac67bff88ec52306efc225', '4863e7544738df62eaae4a1bec031fd9'], panelInitSequence: '15 00 02 11 00 15 00 02 29 00 05 c8 01 11 05 14 01 29', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: null },
    // Panel 4 V22 has "36 02" before final sequence (NO 11 00 / 29 00)
    { name: 'GameConsole R36s Panel 4 V22', md5: [], panelInitSequence: '15 00 02 36 02 05 c8 01 11 05 14 01 29', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: null },
    { name: 'GameConsole R36sPlus', md5: [], panelInitSequence: '05 fa 01 11 39 00 04 b9 f1 12 83 39 00 1c ba 33 81 05 f9', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: null },
    { name: 'GameConsole R46H', md5: [], panelInitSequence: '15 00 02 ee 01 15 00 02 ea 07 15 00 02 eb 12', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: null },
    // Clone variants - differentiated by reset-gpios pattern in binary
    { name: 'Clone R36s Type 1', md5: [], panelInitSequence: '39 00 04 b9 f1 12 83 39 00 06 b1 00 00 00 da 80 39 00 04 b2 00 13 70 39 00 0b b3 10 10 28 28', resetGpios: '&gpio3 RK_PB7 GPIO_ACTIVE_LOW', enableGpios: '&gpio0 RK_PB5 GPIO_ACTIVE_HIGH' },
    { name: 'Clone R36s Type 2', md5: ['eaa316c532c147354ec5cb69dd4409b5'], panelInitSequence: '39 00 04 b9 f1 12 83 39 00 06 b1 00 00 00 da 80 39 00 04 b2 00 13 70 39 00 0b b3 10 10 28 28', resetGpios: '&gpio3 RK_PD3 GPIO_ACTIVE_LOW', enableGpios: '&gpio3 RK_PA3 GPIO_ACTIVE_HIGH' },
    { name: 'Clone R36s Type 3', md5: ['059c64824dbf92ed528880dec22a72ac'], panelInitSequence: '15 00 02 36 02 05 c8 01 11 05 64 01 29', resetGpios: '&gpio3 RK_PB7 GPIO_ACTIVE_LOW', enableGpios: '&gpio0 RK_PB5 GPIO_ACTIVE_HIGH' },
    { name: 'Clone R36s Type 4', md5: ['6655a1e7fafa4630373cccedecb5b6ae'], panelInitSequence: '39 00 04 b9 f1 12 87 39 00 04 b2 78 04 70', resetGpios: '&gpio3 RK_PB7 GPIO_ACTIVE_LOW', enableGpios: '&gpio0 RK_PB5 GPIO_ACTIVE_HIGH' },
    // Kinhank & XiFan
    { name: 'Kinhank K36 Origin', md5: [], panelInitSequence: '39 00 04 b9 f1 12 83 39 00 06 b1 00 00 00 da 80 39 00 04 b2 00 13 70', resetGpios: '&gpio3 RK_PB7 GPIO_ACTIVE_LOW', enableGpios: '&gpio0 RK_PB5 GPIO_ACTIVE_HIGH' },
    { name: 'XiFan MYMINI', md5: ['04d57af3acefbad48505b005d0803c3e', '0bd2d5c14c10918598467cd5cbd259b7', '38644ce69040902198adb12228554cd0'], panelInitSequence: '39 00 04 b9 f1 12 83 39 00 06 b1 00 00 00 da 80 39 00 04 b2 00 13 70', resetGpios: '&gpio3 RK_PB7 GPIO_ACTIVE_LOW', enableGpios: '&gpio0 RK_PB5 GPIO_ACTIVE_HIGH' },
    // AISLPC - uses 05 64 01 29 ending (different delay)
    { name: 'AISLPC K36S / R36T', md5: ['ccc295fcb58c947bbc3026d153eae978', '320555247f7e911cb5c8e1ef7899776e', '9782673a1f17f559a62ee210d4bbf206'], panelInitSequence: '15 00 02 36 02 05 c8 01 11 05 64 01 29', resetGpios: '&gpio3 RK_PB7 GPIO_ACTIVE_LOW', enableGpios: '&gpio0 RK_PB5 GPIO_ACTIVE_HIGH' },
    // SaySouce
    { name: 'SaySouce Soy Sauce V03', md5: ['6043228f47ed2ebd01970f46be133ca9', '861278f7ab7ade97ac1515aedbbdeff0'], panelInitSequence: '39 00 04 b9 f1 12 83 39 00 1c ba 33 81 05 f9 0e 0e 20', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: '&gpio1 RK_PC2 GPIO_ACTIVE_LOW' },
    { name: 'SaySouce Soy Sauce V04', md5: ['0276a922c6206a81a67945b53c042c66'], panelInitSequence: '05 96 01 11 05 32 01 29', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: '&gpio1 RK_PC2 GPIO_ACTIVE_LOW' },
    // Others
    { name: 'R50S', md5: [], panelInitSequence: '05 05 01 01 05 fa 01 11 39 00 06 ff 77 01 00 00 10', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: null },
    { name: 'YMC A10MINI', md5: ['f5e765e3d4f05f46276aa44076db5afc'], panelInitSequence: '05 78 01 11 15 00 02 36 d0 15 00 02 3a 77', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: null },
    { name: 'Diium Dr28s', md5: [], panelInitSequence: '39 00 06 ff 77 01 00 00 13 15 00 02 ef 08', resetGpios: '&gpio3 RK_PB7 GPIO_ACTIVE_LOW', enableGpios: '&gpio0 RK_PB5 GPIO_ACTIVE_HIGH' },
    { name: 'Batlexp G350', md5: [], panelInitSequence: '15 00 03 b6 7f 7f 39 00 05 b8 26 62 f0 63', resetGpios: '&gpio3 RK_PC0 GPIO_ACTIVE_LOW', enableGpios: null },
];

/**
 * MD5 hash calculation
 */
function md5(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const K = new Uint32Array([
        0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
        0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
        0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
        0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
        0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
        0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
        0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
        0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
    ]);
    const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
    let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    const originalLen = bytes.length * 8;
    const padLen = (bytes.length % 64 < 56 ? 56 : 120) - (bytes.length % 64);
    const padded = new Uint8Array(bytes.length + padLen + 8);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    new DataView(padded.buffer).setUint32(padded.length - 8, originalLen >>> 0, true);
    new DataView(padded.buffer).setUint32(padded.length - 4, Math.floor(originalLen / 0x100000000), true);
    for (let i = 0; i < padded.length; i += 64) {
        const M = new Uint32Array(16);
        for (let j = 0; j < 16; j++) M[j] = new DataView(padded.buffer).getUint32(i + j * 4, true);
        let [A, B, C, D] = [a0, b0, c0, d0];
        for (let j = 0; j < 64; j++) {
            let F: number, g: number;
            if (j < 16) { F = (B & C) | (~B & D); g = j; }
            else if (j < 32) { F = (D & B) | (~D & C); g = (5 * j + 1) % 16; }
            else if (j < 48) { F = B ^ C ^ D; g = (3 * j + 5) % 16; }
            else { F = C ^ (B | ~D); g = (7 * j) % 16; }
            F = (F + A + K[j] + M[g]) >>> 0;
            A = D; D = C; C = B;
            const s = S[Math.floor(j / 16) * 4 + (j % 4)];
            B = (B + ((F << s) | (F >>> (32 - s)))) >>> 0;
        }
        a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    return [a0, b0, c0, d0].map(n => {
        const b = new Uint8Array(4);
        new DataView(b.buffer).setUint32(0, n, true);
        return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
    }).join('');
}

/**
 * Searches for a byte pattern in the buffer
 */
function findPattern(view: DataView, pattern: number[], startOffset = 0): number {
    for (let i = startOffset; i <= view.byteLength - pattern.length; i++) {
        let found = true;
        for (let j = 0; j < pattern.length; j++) {
            if (view.getUint8(i + j) !== pattern[j]) { found = false; break; }
        }
        if (found) return i;
    }
    return -1;
}

/**
 * Extracts panel-init-sequence from DTB by searching for known patterns
 */
function extractPanelSequence(buffer: ArrayBuffer): { sequence: number[], prefix: string } | null {
    const view = new DataView(buffer);
    // Common panel-init-sequence starting patterns
    const patterns = [
        [0x39, 0x00, 0x04, 0xb9, 0xf1, 0x12, 0x83], // Panel 0/1 type
        [0x39, 0x00, 0x04, 0xb9, 0xf1, 0x12, 0x87], // Clone Type 4
        [0x39, 0x00, 0x03, 0xe0, 0xab, 0xba],       // Panel 1 type
        [0x15, 0x00, 0x02, 0xff, 0x30, 0x15, 0x00, 0x02, 0xff, 0x52], // Panel 4/V22 type
        [0x15, 0x00, 0x02, 0xee, 0x01, 0x15, 0x00, 0x02, 0xea, 0x07], // R46H/R40XX
        [0x05, 0xfa, 0x01, 0x11, 0x39, 0x00, 0x04, 0xb9], // R36sPlus
        [0x05, 0x78, 0x01, 0x11, 0x15, 0x00, 0x02, 0x36], // YMC A10MINI
        [0x05, 0x05, 0x01, 0x01, 0x05, 0xfa, 0x01, 0x11], // R50S
        [0x39, 0x00, 0x06, 0xff, 0x77, 0x01, 0x00, 0x00, 0x13], // Diium
        [0x05, 0x96, 0x01, 0x11], // SaySouce V04
    ];

    for (const pattern of patterns) {
        const offset = findPattern(view, pattern);
        if (offset >= 0) {
            const seq: number[] = [];
            const maxLen = Math.min(100, view.byteLength - offset);
            for (let i = 0; i < maxLen; i++) seq.push(view.getUint8(offset + i));
            const prefix = seq.slice(0, Math.min(20, seq.length)).map(b => b.toString(16).padStart(2, '0')).join(' ');
            return { sequence: seq, prefix };
        }
    }
    return null;
}

interface AnalysisResult {
    md5: string;
    fileSize: number;
    matchType: 'exact' | 'partial' | 'none';
    matches: string[];
    sequencePrefix?: string;
}

export function DtbDetector(): React.ReactElement {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.dtb') || f.name.endsWith('.dtbo'))) { setFile(f); setError(null); setResult(null); }
        else setError('Selecione um arquivo .dtb ou .dtbo');
    }, []);
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) { setFile(f); setError(null); setResult(null); }
    }, []);

    const analyzeFile = useCallback(async () => {
        if (!file) return;
        setIsAnalyzing(true); setError(null);
        try {
            const buffer = await file.arrayBuffer();
            const view = new DataView(buffer);
            const fileMd5 = md5(buffer);

            // Check MD5 exact match
            const exactMatch = DEVICE_DATABASE.find(d => d.md5.includes(fileMd5));
            if (exactMatch) {
                setResult({ md5: fileMd5, fileSize: file.size, matchType: 'exact', matches: [exactMatch.name] });
                return;
            }

            // Search for each device's complete panel-init-sequence in the binary
            const partialMatches: string[] = [];
            for (const device of DEVICE_DATABASE) {
                const seqBytes = device.panelInitSequence.split(' ').map(h => parseInt(h, 16));
                if (seqBytes.length < 5) continue;
                const found = findPattern(view, seqBytes);
                if (found >= 0) {
                    partialMatches.push(device.name);
                }
            }

            if (partialMatches.length > 0) {
                setResult({ md5: fileMd5, fileSize: file.size, matchType: 'partial', matches: partialMatches });
                return;
            }

            setResult({ md5: fileMd5, fileSize: file.size, matchType: 'none', matches: [] });
        } catch (err) { setError(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`); }
        finally { setIsAnalyzing(false); }
    }, [file]);

    const resetAnalysis = useCallback(() => { setFile(null); setResult(null); setError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }, []);

    return (
        <div className="not-prose my-4">
            <div className="rounded-xl overflow-hidden border border-border bg-card">
                <div className="p-6 bg-emerald-600 dark:bg-emerald-900/50 border-b border-emerald-500/20">
                    <div className="flex items-center gap-3 text-white dark:text-emerald-50">
                        <Search className="w-8 h-8" />
                        <div>
                            <h3 className="text-xl font-bold m-0 text-white!">Detector de DTB</h3>
                            <p className="text-white text-sm m-0">Identifique a configuração do seu R36S através do arquivo DTB</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {!result ? (
                        <>
                            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                                    isDragging ? "border-(--fd-primary) bg-(--fd-primary)/10" : "border hover:border-(--fd-primary)/50 hover:bg-muted/50 bg-muted/20"
                                )}
                                onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="font-medium mb-2 text-foreground">Arraste o arquivo DTB aqui</p>
                                <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                                <p className="text-xs mt-2 text-muted-foreground">Arquivos .dtb ou .dtbo</p>
                            </div>
                            <input ref={fileInputRef} type="file" accept=".dtb,.dtbo" className="hidden" onChange={handleFileSelect} />

                            {file && (
                                <div className="mt-4 p-4 rounded-lg bg-accent">
                                    <div className="flex justify-between items-center text-foreground">
                                        <span className="font-medium">{file.name}</span>
                                        <span className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </div>
                            )}

                            {error && <div className="mt-4 p-4 rounded-lg bg-red-600/10 border border-red-600/20 text-destructive">{error}</div>}

                            {file && (
                                <button onClick={analyzeFile} disabled={isAnalyzing}
                                    className="w-full mt-4 rw-btn text-(--fd-primary) dark:bg-transparent! dark:border-green-500/20! border! hover:bg-green-100/20 dark:hover:bg-green-100/5! transition-colors">
                                    {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Analisando...</> : 'Analisar'}
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="p-4 rounded-lg mb-4 font-mono text-sm bg-zinc-100 border dark:bg-zinc-800/20">
                                <div><span className="dark:text-zinc-300">MD5:</span> <span className="text-yellow-600 dark:text-amber-400">{result.md5}</span></div>
                                <div><span className="dark:text-zinc-300">Tamanho:</span> <span className="text-yellow-600 dark:text-amber-400">{result.fileSize}</span> bytes</div>
                            </div>

                            {result.matchType === 'exact' && (
                                <div className="p-4 rounded-lg border bg-emerald-500/10 border-emerald-500/30">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium mb-2"><CheckCircle className="w-5 h-5" />Correspondência Exata</div>
                                    <p className="text-sm text-muted-foreground">Dispositivo identificado: <strong className="text-emerald-600 dark:text-emerald-400">{result.matches[0]}</strong></p>
                                </div>
                            )}

                            {result.matchType === 'partial' && (
                                <div className="p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/30">
                                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-medium mb-2"><AlertTriangle className="w-5 h-5" />Correspondência Parcial</div>
                                    <p className="text-sm mb-2 text-muted-foreground">MD5 diferente, mas parâmetros de tela compatíveis:</p>
                                    <ul className="text-sm">{result.matches.map((m, i) => <li key={i} className="text-yellow-600 dark:text-yellow-400">• {m}</li>)}</ul>
                                </div>
                            )}

                            {result.matchType === 'none' && (
                                <div className="p-4 rounded-lg border bg-muted/50 border-border">
                                    <div className="flex items-center gap-2 font-medium mb-2 text-muted-foreground"><HelpCircle className="w-5 h-5" />Dispositivo Não Identificado</div>
                                    <p className="text-sm text-muted-foreground">Este arquivo DTB não corresponde a nenhuma configuração conhecida.</p>
                                </div>
                            )}

                            <button onClick={resetAnalysis} className="w-full mt-4 py-3 rounded-lg font-medium border border-border text-foreground text-(--fd-primary) dark:bg-transparent! dark:border-green-500/20! hover:bg-green-100/20 dark:hover:bg-green-100/5! transition-colors">
                                Analisar Outro Arquivo
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DtbDetector;
