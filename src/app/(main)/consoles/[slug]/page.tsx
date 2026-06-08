import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getDeviceBySlug } from "@/lib/devices";
import { listArticlesByDevice, typeLabel } from "@/lib/articles";
import { DeviceSpecCard } from "@/components/catalog/device-spec-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";

const BASE = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getDeviceBySlug(slug);
  if (!detail) return {};
  const extra = (detail.device.extra ?? {}) as { description?: string };
  return {
    title: detail.device.name,
    description: extra.description?.slice(0, 160),
  };
}

export default async function DevicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getDeviceBySlug(slug);
  if (!detail) notFound();

  const guides = await listArticlesByDevice(detail.device.id);
  const extra = (detail.device.extra ?? {}) as { description?: string };

  return (
    <main id="main" className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: detail.device.name,
          brand: { "@type": "Brand", name: detail.device.manufacturer },
          category: "Handheld game console",
          ...(extra.description ? { description: extra.description } : {}),
          ...(detail.images[0] ? { image: `${BASE}${detail.images[0].url}` } : {}),
        }}
      />
      <div className="page__head mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/consoles">
            <ChevronLeft className="size-4" aria-hidden="true" /> Voltar ao catálogo
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/consoles/comparar?a=${detail.device.slug}`}>Comparar</Link>
        </Button>
      </div>

      <DeviceSpecCard detail={detail} />

      {guides.length > 0 && (
        <section aria-labelledby="guias-device" className="account__section">
          <h2 id="guias-device" className="font-semibold">Guias deste console</h2>
          <ul className="link-list link-list--grid mt-3">
            {guides.map((g) => (
              <li key={g.id}>
                <Link href={`/guias/${g.slug}`} className="link-card link-card--sm">
                  {g.title}
                  <span className="link-card__meta">{typeLabel(g.type)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
