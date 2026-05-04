import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      {/* PageHeader skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-7 w-28" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="space-y-5">
        {/* Filter bar skeleton */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-[22px] border border-slate-200/60 w-fit">
            <Skeleton className="size-9 rounded-[16px]" />
            <div className="flex items-center gap-1.5 px-1">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <Skeleton className="h-9 w-24 rounded-xl" />
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-slate-50/50 rounded-[2rem] border border-slate-200/60 shadow-sm p-4">
          <TableSkeleton rows={8} cols={5} />
        </div>
      </div>
    </div>
  );
}
