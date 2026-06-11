import Link from "next/link";
import { Check, Star, Zap, Shield, Heart, Gamepad2, Download, Settings, Info, Trophy, Sparkles, Rocket, FileCheck, ExternalLink, BadgeCheck, AlertTriangle, Lightbulb, HardDrive, Wifi, Package } from "lucide-react";
import type { Layout, Widget } from "@/lib/pages";
import type { IconKey } from "@/lib/page-icons";
import { parseVideoEmbed } from "@/lib/video-embed";
import { cn } from "@/lib/utils";
import { RichContent } from "@/components/blocks/rich-content";
import type { RichDoc } from "@/lib/blocks/rich-schema";
import { Reveal } from "@/components/pages/reveal";
import { SectionFx } from "@/components/pages/fx-backgrounds";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { AuroraText } from "@/components/ui/aurora-text";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { TextAnimate } from "@/components/ui/text-animate";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { LineShadowText } from "@/components/ui/line-shadow-text";
import { HyperText } from "@/components/ui/hyper-text";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Marquee } from "@/components/ui/marquee";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";
import GlareHover from "@/components/GlareHover";
import { DeviceGridWidget } from "@/components/pages/device-grid-widget";

const FX_BG = "page-sec--bg page-sec--fx-host";
export const SEC_BG: Record<string, string> = {
  none: "", muted: "page-sec--bg bg-muted/50", card: "page-sec--bg bg-card",
  primary: "page-sec--bg bg-primary/10", dark: "page-sec--bg bg-foreground/90 text-background",
  gradient: "page-sec--bg page-sec--gradient",
  particles: FX_BG, retrogrid: FX_BG, meteors: FX_BG, dots: FX_BG, ripple: FX_BG, flickering: FX_BG,
  animgrid: FX_BG, interactivegrid: FX_BG, hexagon: FX_BG, striped: FX_BG, lightrays: FX_BG,
};
export const SEC_PADY: Record<string, string> = {
  none: "", sm: "py-5", md: "py-10", lg: "py-16",
};

const ICONS: Record<IconKey, typeof Check> = {
  check: Check, star: Star, zap: Zap, shield: Shield, heart: Heart, gamepad: Gamepad2,
  download: Download, settings: Settings, info: Info, trophy: Trophy, sparkles: Sparkles, rocket: Rocket,
};

const TRUST: Record<string, { label: string; mod: string; Icon: typeof Check }> = {
  verified: { label: "Verificado", mod: "trust--verified", Icon: BadgeCheck },
  trusted: { label: "Confiável", mod: "trust--trusted", Icon: Shield },
  caution: { label: "Cautela", mod: "trust--caution", Icon: AlertTriangle },
  choice: { label: "Escolha", mod: "trust--choice", Icon: Star },
};
const CATEGORY: Record<string, { label: string; Icon: typeof Check }> = {
  storage: { label: "Armazenamento", Icon: HardDrive },
  connectivity: { label: "Conectividade", Icon: Wifi },
  protection: { label: "Proteção", Icon: Shield },
  other: { label: "Outros", Icon: Package },
};
const ghSafe = (s: string) => /^[A-Za-z0-9_.-]+$/.test(s);

// Span (1-12) → classe de col-span estática (Tailwind precisa de nomes literais).
const COL_SPAN: Record<number, string> = {
  1: "sm:col-span-1", 2: "sm:col-span-2", 3: "sm:col-span-3", 4: "sm:col-span-4",
  5: "sm:col-span-5", 6: "sm:col-span-6", 7: "sm:col-span-7", 8: "sm:col-span-8",
  9: "sm:col-span-9", 10: "sm:col-span-10", 11: "sm:col-span-11", 12: "sm:col-span-12",
};

const ALIGN: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right" };
const TEXT_COLOR: Record<string, string> = {
  default: "", muted: "text-muted-foreground", primary: "text-primary",
  success: "text-emerald-600", warn: "text-amber-600",
};
export const COL_VALIGN: Record<string, string> = { top: "justify-start", center: "justify-center", bottom: "justify-end" };
export const COL_BG: Record<string, string> = { none: "", muted: "rounded-lg bg-muted/40 p-4", card: "rounded-lg border border-border bg-card p-4" };

function safeHref(href: string): string | null {
  return /^(https?:\/\/|\/|#)/i.test(href) ? href : null;
}

export function WidgetView({ w }: { w: Widget }) {
  switch (w.type) {
    case "heading": {
      const fx = w.fx ?? "none";
      const cls = `page-w__heading ${ALIGN[w.align] ?? ""} ${fx === "none" ? TEXT_COLOR[w.color] ?? "" : ""}`;
      const Tag = w.level === 3 ? "h3" : w.level === 4 ? "h4" : "h2";
      // O efeito sempre fica DENTRO do heading (Tag de bloco) para herdar o alinhamento.
      const inner =
        fx === "gradient" ? <AnimatedGradientText colorFrom="#10b981" colorTo="#6366f1" speed={1.2}>{w.text}</AnimatedGradientText> :
        fx === "aurora" ? <AuroraText colors={["#10b981", "#6366f1", "#22d3ee"]}>{w.text}</AuroraText> :
        fx === "shiny" ? <AnimatedShinyText className="inline">{w.text}</AnimatedShinyText> :
        fx === "textanimate" ? <TextAnimate as="span" animation="blurInUp" by="word" className="inline-block">{w.text}</TextAnimate> :
        fx === "typing" ? <TypingAnimation as="span" className="inline">{w.text}</TypingAnimation> :
        fx === "lineshadow" ? <LineShadowText shadowColor="#10b981">{w.text}</LineShadowText> :
        fx === "hyper" ? <HyperText as="span" className="inline-block">{w.text}</HyperText> :
        w.text;
      return <Tag className={cls}>{inner}</Tag>;
    }
    case "text":
      return (
        <div className={`page-w__text ${ALIGN[w.align] ?? ""} ${TEXT_COLOR[w.color] ?? ""}`}>
          {w.text.split(/\n{2,}/).map((para, i) => (
            <p key={i}>
              {para.split("\n").map((line, j, arr) => (
                <span key={j}>
                  {line}
                  {j < arr.length - 1 && <br />}
                </span>
              ))}
            </p>
          ))}
        </div>
      );
    case "image":
      if (!w.url) return null;
      return (
        <figure className="page-w__figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={w.url} alt={w.alt} className="page-w__img" loading="lazy" />
          {w.caption && <figcaption className="page-w__caption">{w.caption}</figcaption>}
        </figure>
      );
    case "button": {
      const href = safeHref(w.href);
      if (!href) return null;
      const wrap = `page-w__btnwrap ${ALIGN[w.align] ?? ""}`;
      const isInternal = href.startsWith("/");
      if (w.variant === "rainbow") {
        return (
          <div className={wrap}>
            <RainbowButton asChild>
              {isInternal
                ? <Link href={href}>{w.label}</Link>
                : <a href={href} rel="nofollow noopener noreferrer" target="_blank">{w.label}</a>}
            </RainbowButton>
          </div>
        );
      }
      const cls = `page-w__btn page-w__btn--${w.variant}`;
      return (
        <div className={wrap}>
          {isInternal ? (
            <Link href={href} className={cls}>{w.label}</Link>
          ) : (
            <a href={href} className={cls} rel="nofollow noopener noreferrer" target="_blank">{w.label}</a>
          )}
        </div>
      );
    }
    case "divider":
      return <hr className="page-w__divider" />;
    case "spacer":
      return <div className={`page-w__spacer page-w__spacer--${w.size}`} aria-hidden="true" />;
    case "video": {
      const v = parseVideoEmbed(w.url);
      if (!v) return null;
      return (
        <div className="page-w__video">
          <iframe
            src={v.src}
            title="Vídeo"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    case "callout":
      return (
        <div className={`page-w__callout page-w__callout--${w.tone}`}>
          {w.text.split(/\n+/).map((line, i) => <p key={i}>{line}</p>)}
        </div>
      );
    case "accordion":
      return (
        <div className="page-w__accordion">
          {w.items.map((it, i) => (
            <details key={i} className="page-w__acc-item">
              <summary className="page-w__acc-title">{it.title}</summary>
              <div className="page-w__acc-body">
                {it.body.split(/\n+/).map((line, j) => <p key={j}>{line}</p>)}
              </div>
            </details>
          ))}
        </div>
      );
    case "gallery":
      return (
        <ul className={`page-w__gallery page-w__gallery--c${w.columns}`}>
          {w.images.filter((im) => im.url).map((im, i) => (
            <li key={i} className="page-w__gallery-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.url} alt={im.alt} className="page-w__gallery-img" loading="lazy" />
            </li>
          ))}
        </ul>
      );
    case "card": {
      const href = w.href ? safeHref(w.href) : null;
      const effect = w.effect ?? "none";
      const inner = (
        <>
          {w.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.image} alt="" className="page-w__card-img" loading="lazy" />
          )}
          <div className="page-w__card-body">
            <h3 className="page-w__card-title">{w.title}</h3>
            {w.text && <p className="page-w__card-text">{w.text}</p>}
            {href && w.buttonLabel && (
              href.startsWith("/")
                ? <Link href={href} className="page-w__btn page-w__btn--primary mt-1">{w.buttonLabel}</Link>
                : <a href={href} className="page-w__btn page-w__btn--primary mt-1" rel="nofollow noopener noreferrer" target="_blank">{w.buttonLabel}</a>
            )}
          </div>
        </>
      );
      if (effect === "magic") {
        return <MagicCard className="page-w__card page-w__card--fx" gradientColor="#10b981" gradientOpacity={0.18}>{inner}</MagicCard>;
      }
      if (effect === "glare") {
        return (
          <GlareHover width="100%" height="100%" background="transparent" borderRadius="0.75rem" borderColor="transparent" glareColor="#10b981" glareOpacity={0.3}>
            <div className="page-w__card page-w__card--fx w-full">{inner}</div>
          </GlareHover>
        );
      }
      return (
        <div className={cn("page-w__card", effect !== "none" && "page-w__card--fx")}>
          {effect === "beam" && <BorderBeam colorFrom="#10b981" colorTo="#6366f1" size={70} />}
          {effect === "shine" && <ShineBorder shineColor={["#10b981", "#6366f1"]} />}
          {inner}
        </div>
      );
    }
    case "richtext":
      return <div className="page-w__rich"><RichContent doc={w.doc as RichDoc} /></div>;
    case "deviceGrid":
      return <DeviceGridWidget title={w.title} limit={w.limit} showAll={w.showAll} />;
    case "numberTicker":
      return (
        <div className={`page-w__ticker ${ALIGN[w.align] ?? ""}`}>
          <span className="page-w__ticker-num">
            {w.prefix}<NumberTicker value={w.value} className="text-inherit" />{w.suffix}
          </span>
          {w.label && <span className="page-w__ticker-label">{w.label}</span>}
        </div>
      );
    case "marquee":
      return (
        <Marquee className="[--duration:30s]" reverse={w.reverse} pauseOnHover={w.pauseOnHover}>
          {w.items.map((it, i) => (
            <span key={i} className="page-w__marquee-item">{it.text}</span>
          ))}
        </Marquee>
      );
    case "bento":
      return (
        <BentoGrid className="auto-rows-[14rem] grid-cols-1 sm:grid-cols-3">
          {w.items.map((it, i) => {
            const Icon = ICONS[it.icon] ?? Check;
            const bhref = it.href ? safeHref(it.href) : null;
            return (
              <BentoCard
                key={i}
                name={it.title}
                className={cn("col-span-1", it.wide ? "sm:col-span-2" : "sm:col-span-1")}
                background={<div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />}
                Icon={Icon}
                description={it.description}
                href={bhref ?? "#"}
                cta="Ver mais"
              />
            );
          })}
        </BentoGrid>
      );
    case "animatedList":
      return (
        <AnimatedList className="w-full" delay={1400}>
          {w.items.map((it, i) => {
            const Icon = ICONS[it.icon] ?? Check;
            return (
              <AnimatedListItem key={i}>
                <figure className="page-w__alist-item">
                  <span className="page-w__alist-icon"><Icon className="size-5" aria-hidden="true" /></span>
                  <div className="min-w-0">
                    <figcaption className="page-w__alist-title">{it.title}</figcaption>
                    {it.description && <p className="page-w__alist-desc">{it.description}</p>}
                  </div>
                </figure>
              </AnimatedListItem>
            );
          })}
        </AnimatedList>
      );
    case "download":
      return (
        <div className="dl-list">
          {w.items.map((it, i) => {
            const href = safeHref(it.url);
            const chHref = it.changelogUrl ? safeHref(it.changelogUrl) : null;
            return (
              <div key={i} className="dl-item">
                <div className="min-w-0">
                  <div className="dl-item__head">
                    <h4 className="dl-item__name">{it.name}</h4>
                    {it.version && <span className="dl-badge">{it.version}</span>}
                  </div>
                  <div className="dl-item__meta">
                    {it.size && <span>{it.size}</span>}
                    {it.date && <span>Lançado em {it.date}</span>}
                    {chHref && <a href={chHref} target="_blank" rel="nofollow noopener noreferrer" className="dl-item__link"><ExternalLink className="size-3" aria-hidden="true" /> Changelog</a>}
                  </div>
                  {it.checksum && (
                    <details className="dl-item__sum">
                      <summary><FileCheck className="size-3" aria-hidden="true" /> Verificar SHA256</summary>
                      <code className="dl-item__code">{it.checksum}</code>
                    </details>
                  )}
                </div>
                {href && <a href={href} className="dl-item__btn" rel="nofollow noopener noreferrer"><Download className="size-4" aria-hidden="true" /> Baixar</a>}
              </div>
            );
          })}
        </div>
      );
    case "firmware":
      return (
        <div className="fw-list">
          {w.items.map((it, i) => {
            const gh = it.owner && it.repo && ghSafe(it.owner) && ghSafe(it.repo) ? `https://github.com/${it.owner}/${it.repo}/releases` : null;
            const site = it.website ? safeHref(it.website) : null;
            const href = gh || site;
            return (
              <div key={i} className={cn("fw-item", it.deprecated && "fw-item--dep")}>
                <div className="min-w-0">
                  <h4 className="fw-item__name">{it.name}{it.deprecated && <span className="fw-item__dep">obsoleto</span>}</h4>
                  {it.description && <p className="fw-item__desc">{it.description}</p>}
                </div>
                {href && <a href={href} className="fw-item__btn" target="_blank" rel="nofollow noopener noreferrer"><ExternalLink className="size-4" aria-hidden="true" /> {gh ? "Releases" : "Site"}</a>}
              </div>
            );
          })}
        </div>
      );
    case "buyingGuide":
      return (
        <div className="buy-guide">
          <div className="buy-guide__head">
            <h3 className="buy-guide__title">Onde comprar: {w.consoleName}</h3>
            {w.priceRange && <span className="buy-guide__price">{w.priceRange}</span>}
          </div>
          {w.stores.length > 0 && (
            <div className="buy-guide__sec">
              <h4 className="buy-guide__sub">Lojas recomendadas</h4>
              {w.stores.map((s, i) => {
                const t = TRUST[s.trustLevel] ?? TRUST.trusted;
                const href = safeHref(s.href);
                return (
                  <div key={i} className="buy-store">
                    <div className="min-w-0">
                      <div className="buy-store__head">
                        <span className="buy-store__name">{s.name}</span>
                        <span className={cn("buy-trust", t.mod)}><t.Icon className="size-3" aria-hidden="true" /> {t.label}</span>
                        {s.badge && <span className="buy-store__badge">{s.badge}</span>}
                      </div>
                      {s.description && <p className="buy-store__desc">{s.description}</p>}
                    </div>
                    {href && <a href={href} className="buy-store__btn" target="_blank" rel="nofollow noopener noreferrer"><ExternalLink className="size-4" aria-hidden="true" /></a>}
                  </div>
                );
              })}
            </div>
          )}
          {w.accessories.length > 0 && (
            <div className="buy-guide__sec">
              <h4 className="buy-guide__sub">Acessórios</h4>
              {w.accessories.map((a, i) => {
                const c = CATEGORY[a.category] ?? CATEGORY.other;
                const href = safeHref(a.href);
                return (
                  <div key={i} className="buy-store">
                    <div className="min-w-0">
                      <div className="buy-store__head">
                        <span className="buy-acc__cat" aria-hidden="true"><c.Icon className="size-3.5" /></span>
                        <span className="buy-store__name">{a.name}</span>
                        {a.badge && <span className="buy-store__badge">{a.badge}</span>}
                      </div>
                      {a.description && <p className="buy-store__desc">{a.description}</p>}
                    </div>
                    {href && <a href={href} className="buy-store__btn" target="_blank" rel="nofollow noopener noreferrer"><ExternalLink className="size-4" aria-hidden="true" /></a>}
                  </div>
                );
              })}
            </div>
          )}
          {w.tips.length > 0 && (
            <div className="buy-guide__sec">
              <h4 className="buy-guide__sub">Dicas</h4>
              {w.tips.map((tp, i) => (
                <div key={i} className={cn("buy-tip", tp.type === "warning" ? "buy-tip--warn" : "buy-tip--ok")}>
                  <span className="buy-tip__icon" aria-hidden="true">{tp.type === "warning" ? <AlertTriangle className="size-4" /> : <Lightbulb className="size-4" />}</span>
                  <div className="min-w-0">
                    <p className="buy-tip__title">{tp.title}</p>
                    {tp.description && <p className="buy-tip__desc">{tp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    case "iconList":
      return (
        <ul className="page-w__iconlist">
          {w.items.map((it, i) => {
            const Icon = ICONS[it.icon] ?? Check;
            return (
              <li key={i} className="page-w__iconlist-item">
                <span className="page-w__iconlist-icon" aria-hidden="true"><Icon className="size-4" /></span>
                <span>{it.text}</span>
              </li>
            );
          })}
        </ul>
      );
    default:
      return null;
  }
}

/** Render seguro de uma página montada no construtor. Tudo via JSX, sem
 * dangerouslySetInnerHTML. */
export function PageRenderer({ layout }: { layout: Layout }) {
  return (
    <div className="page-render">
      {layout.sections.map((s) => (
        <section
          key={s.id}
          className={cn("page-sec", SEC_BG[s.bg], SEC_PADY[s.padY], s.full && "page-sec--full")}
          style={s.bg === "gradient" ? { backgroundImage: `linear-gradient(120deg, ${s.gradFrom}, ${s.gradTo})` } : undefined}
        >
          <div className="page-sec__fx" aria-hidden="true"><SectionFx bg={s.bg} /></div>
          <Reveal anim={s.anim ?? "none"} className="page-section">
            {s.columns.map((c) => (
              <div key={c.id} className={cn("page-col flex flex-col", COL_SPAN[c.span] ?? "sm:col-span-12", COL_VALIGN[c.valign], COL_BG[c.bg])}>
                {c.widgets.map((w, i) => (
                  <div key={i} className="page-w">
                    <WidgetView w={w} />
                  </div>
                ))}
              </div>
            ))}
          </Reveal>
        </section>
      ))}
    </div>
  );
}
