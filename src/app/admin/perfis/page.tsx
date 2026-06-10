import { listGroupsWithFields } from "@/lib/admin/profile-fields";
import { getProfileSettings, getGallerySettings, getProfileCompletionSettings } from "@/lib/settings";
import { ProfilesTabs } from "@/components/admin/profiles-tabs";

export const dynamic = "force-dynamic";

export default async function ProfilesAdminPage() {
  const [groups, settings, gallery, completion] = await Promise.all([
    listGroupsWithFields(),
    getProfileSettings(),
    getGallerySettings(),
    getProfileCompletionSettings(),
  ]);
  return (
    <>
      <h1 className="page__title">Perfis</h1>
      <p className="page__note">Campos customizados do perfil dos membros e regras do nome de exibição.</p>
      <ProfilesTabs groups={groups} settings={settings} gallery={gallery} completion={completion} />
    </>
  );
}
