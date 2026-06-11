import { getAllMenuItems } from "@/lib/menu";
import { MenuManager } from "@/components/admin/menu-manager";

export const dynamic = "force-dynamic";

export default async function AdminMenusPage() {
  const [header, footer] = await Promise.all([getAllMenuItems("header"), getAllMenuItems("footer")]);

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
    </>
  );
}
