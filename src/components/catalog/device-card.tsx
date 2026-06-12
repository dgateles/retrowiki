import Link from "next/link";
import Image from "next/image";
import { Gamepad2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  slug: string;
  name: string;
  manufacturer: string;
  frontImage?: string | null;
};

/** Card de console baseado em shadcn Card + Badge (usado na home e na lista). */
export function DeviceCard({ slug, name, manufacturer, frontImage }: Props) {
  return (
    <Link href={`/consoles/${slug}`} className="group block h-full">
      <Card className="card-glow flex h-full flex-col gap-3 p-4">
        <div className="crt-screen relative mx-auto h-[150px] w-[195px] max-w-full p-3">
          {frontImage ? (
            <span className="relative block h-full w-full">
              <Image
                src={frontImage}
                alt={`${name}, vista frontal`}
                fill
                sizes="195px"
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </span>
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <Gamepad2 className="size-12 text-muted-foreground/30" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Badge variant="secondary" className="w-fit font-mono text-[10px] tracking-wider uppercase">
            {manufacturer}
          </Badge>
          <h3 className="font-semibold leading-tight">{name}</h3>
        </div>
      </Card>
    </Link>
  );
}
