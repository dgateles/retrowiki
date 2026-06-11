import { PageHeadSkeleton, FilterBarSkeleton, GuideListSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <main id="main" className="page">
      <PageHeadSkeleton />
      <FilterBarSkeleton />
      <GuideListSkeleton />
    </main>
  );
}
