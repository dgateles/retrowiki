import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { getMenuTree, seedToTree, DEFAULT_FOOTER } from "@/lib/menu";
import { getFooterSettings } from "@/lib/settings";

export async function SiteFooter() {
  const tree = await getMenuTree("footer");
  const cols = tree.length ? tree : seedToTree(DEFAULT_FOOTER);
  const footer = await getFooterSettings();
  const copyright = footer.copyright.replaceAll("{year}", String(new Date().getFullYear()));

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__cols">
          <div className="site-footer__brand">
            <Link href="/" className="site-footer__logo">
              <Gamepad2 className="size-5 text-primary" aria-hidden="true" /> RetroWiki
            </Link>
            <p className="site-footer__tagline">{footer.tagline}</p>
          </div>

          {cols.map((col) =>
            col.children.length === 0 ? null : (
              <nav key={col.id} className="site-footer__col" aria-label={col.label}>
                {col.href ? (
                  <Link href={col.href} className="site-footer__heading">{col.label}</Link>
                ) : (
                  <p className="site-footer__heading">{col.label}</p>
                )}
                <ul className="site-footer__links">
                  {col.children.map((c) => (
                    <li key={c.id}>
                      <Link href={c.href ?? "#"} className="site-footer__link">{c.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ),
          )}
        </div>

        <div className="site-footer__bottom">{copyright}</div>
      </div>
    </footer>
  );
}
