import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { listActiveAnnouncements } from "@/lib/announcements";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const announcements = await listActiveAnnouncements();
  return (
    <>
      <SiteHeader />
      {announcements.length > 0 && <AnnouncementBanner items={announcements} />}
      <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">{children}</div>
      <SiteFooter />
    </>
  );
}
