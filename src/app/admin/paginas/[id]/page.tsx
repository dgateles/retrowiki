import { redirect } from "next/navigation";

// O construtor agora abre em tela cheia, fora do admin.
export default async function LegacyBuilderRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/construtor/${id}`);
}
