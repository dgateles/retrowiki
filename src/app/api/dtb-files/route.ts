import { NextResponse, type NextRequest } from "next/server";

// Proxy/normalizador da API pública do DTB Vault (dtbvault.com). Busca no
// servidor para cachear (60s) e não expor o cliente a variações de CORS/shape.
// Configurável por env caso o host mude.
const API = process.env.DTBVAULT_API_URL ?? "https://dtbvault.com/api/files";

export const revalidate = 60;

type DtbFile = {
  filename: string;
  console: string;
  boardRevision: string;
  uploadedAt: string;
  totalDownloads: number;
  url: string;
};

export async function GET(req: NextRequest) {
  const count = Math.min(10, Math.max(1, Number(req.nextUrl.searchParams.get("count")) || 5));
  try {
    const res = await fetch(`${API}?sort=newest&pageSize=${count}`, {
      next: { revalidate: 60 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return NextResponse.json({ files: [] });
    const data: unknown = await res.json();
    // A lista pode vir como array direto ou dentro de items/data/files.
    const arr: Record<string, unknown>[] = Array.isArray(data)
      ? (data as Record<string, unknown>[])
      : ((data as { items?: unknown[]; data?: unknown[]; files?: unknown[] }).items
        ?? (data as { data?: unknown[] }).data
        ?? (data as { files?: unknown[] }).files
        ?? []) as Record<string, unknown>[];

    const files: DtbFile[] = arr
      .map((f) => ({
        filename: String(f.filename ?? ""),
        console: String(f.console ?? ""),
        boardRevision: String(f.boardRevision ?? ""),
        uploadedAt: String(f.uploadedAt ?? ""),
        totalDownloads: Number(f.totalDownloads ?? 0),
        url: String(f.url ?? ""),
      }))
      .filter((f) => f.filename && f.url)
      // Garante "últimos enviados" independentemente da ordenação da API.
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, count);

    return NextResponse.json({ files }, { headers: { "cache-control": "public, max-age=60, s-maxage=60" } });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
