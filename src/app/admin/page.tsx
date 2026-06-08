import Link from "next/link";
import { Gamepad2, BookOpen, Users } from "lucide-react";

const CARDS = [
  { href: "/admin/consoles", icon: Gamepad2, title: "Consoles", desc: "Cadastrar e editar handhelds, specs, emulação e imagens." },
  { href: "/admin/membros", icon: Users, title: "Membros", desc: "Papéis, confiança e suspensões dos usuários." },
  { href: "/moderacao", icon: BookOpen, title: "Moderação", desc: "Fila de revisão de guias e tutoriais da comunidade." },
];

export default function AdminHome() {
  return (
    <>
      <h1 className="page__title">Administração</h1>
      <p className="page__note">Gestão da plataforma.</p>
      <div className="admin-cards mt-6">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="admin-card">
            <c.icon className="size-6 text-primary" aria-hidden="true" />
            <h2 className="admin-card__title mt-2">{c.title}</h2>
            <p className="admin-card__desc">{c.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
