import Link from "next/link";
import type { Layout, Widget } from "@/lib/pages";
import { parseVideoEmbed } from "@/lib/video-embed";

const COL_SPAN: Record<string, string> = {
  full: "page-col--full",
  "1/2": "page-col--half",
  "1/3": "page-col--third",
  "2/3": "page-col--twothirds",
  "1/4": "page-col--quarter",
  "3/4": "page-col--threequarters",
};

const ALIGN: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right" };

function safeHref(href: string): string | null {
  return /^(https?:\/\/|\/|#)/i.test(href) ? href : null;
}

export function WidgetView({ w }: { w: Widget }) {
  switch (w.type) {
    case "heading": {
      const cls = `page-w__heading ${ALIGN[w.align] ?? ""}`;
      if (w.level === 3) return <h3 className={cls}>{w.text}</h3>;
      if (w.level === 4) return <h4 className={cls}>{w.text}</h4>;
      return <h2 className={cls}>{w.text}</h2>;
    }
    case "text":
      return (
        <div className={`page-w__text ${ALIGN[w.align] ?? ""}`}>
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
      const cls = `page-w__btn page-w__btn--${w.variant}`;
      const wrap = `page-w__btnwrap ${ALIGN[w.align] ?? ""}`;
      const isInternal = href.startsWith("/");
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
        <section key={s.id} className="page-section">
          {s.columns.map((c) => (
            <div key={c.id} className={`page-col ${COL_SPAN[c.width] ?? "page-col--full"}`}>
              {c.widgets.map((w, i) => (
                <div key={i} className="page-w">
                  <WidgetView w={w} />
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
