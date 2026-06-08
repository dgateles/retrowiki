import Link from "next/link";
import { cn } from "@/lib/utils";

export const SETTINGS_SECTIONS = [
  { key: "geral", label: "Visão geral" },
  { key: "nome", label: "Nome de exibição" },
  { key: "senha", label: "Senha" },
  { key: "email", label: "E-mail" },
  { key: "seguranca", label: "Segurança" },
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]["key"];

export function SettingsNav({ active }: { active: SettingsSection }) {
  return (
    <nav className="settings__nav" aria-label="Configurações da conta">
      {SETTINGS_SECTIONS.map((s) => (
        <Link
          key={s.key}
          href={`/conta?secao=${s.key}`}
          aria-current={active === s.key ? "page" : undefined}
          className={cn("settings__link", active === s.key && "settings__link--active")}
        >
          {s.label}
        </Link>
      ))}
    </nav>
  );
}
