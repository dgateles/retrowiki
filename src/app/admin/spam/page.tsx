import { getSpamSettings } from "@/lib/settings";
import { listQuestions, listGeoRules } from "@/lib/spam";
import { SpamAdmin } from "@/components/admin/spam-admin";

export const dynamic = "force-dynamic";

export default async function SpamAdminPage() {
  const [settings, questions, geoRules] = await Promise.all([getSpamSettings(), listQuestions(), listGeoRules()]);
  return (
    <>
      <h1 className="page__title">Prevenção de spam</h1>
      <p className="page__note">Dificuldade do RetroGuard, desafio Pergunta &amp; Resposta no cadastro e bloqueio por país.</p>
      <SpamAdmin settings={settings} questions={questions} geoRules={geoRules} />
    </>
  );
}
