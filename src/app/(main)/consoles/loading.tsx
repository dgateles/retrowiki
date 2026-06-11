import { PageHeadSkeleton, FilterBarSkeleton, DeviceGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <main id="main" className="page">
      <PageHeadSkeleton note />
      <FilterBarSkeleton />
      <DeviceGridSkeleton />
    </main>
  );
}
