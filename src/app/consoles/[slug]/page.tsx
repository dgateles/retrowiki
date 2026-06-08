import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getDeviceBySlug } from "@/lib/devices";
import { DeviceSpecCard } from "@/components/catalog/device-spec-card";
import { Button } from "@/components/ui/button";

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

  return (
    <main id="main" className="mx-auto max-w-4xl px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/consoles">
          <ChevronLeft className="size-4" aria-hidden="true" /> Voltar ao catálogo
        </Link>
      </Button>
      <DeviceSpecCard detail={detail} />
    </main>
  );
}
