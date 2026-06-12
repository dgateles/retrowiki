import { getAllMenuItems, ensureMenuSeeded } from "@/lib/menu";
import { getFooterSettings } from "@/lib/settings";
import { MenuManager } from "@/components/admin/menu-manager";
import { FooterSettingsForm } from "@/components/admin/footer-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminMenusPage() {
  // Materializa o padrão em localizações vazias para que o editor reflita o
  // que o site exibe (header/footer usam o mesmo padrão como fallback).
  await ensureMenuSeeded();
  const [header, footer, footerSettings] = await Promise.all([
    getAllMenuItems("header"),
    getAllMenuItems("footer"),
    getFooterSettings(),
  ]);

  return (
    <>
      <div className="page__head">
        <h1 className="page__title">Menus</h1>
      </div>
      <p className="muted">
        Gerencie a navegação do header (links, flyouts e dropdowns) e as colunas do footer.
        Submenus aparecem dentro de flyouts/dropdowns; flyouts mostram ícone e descrição.
      </p>
      <MenuManager header={header} footer={footer} />
      <div className="mt-8">
        <FooterSettingsForm initial={footerSettings} />
      </div>
    </>
  );
}
