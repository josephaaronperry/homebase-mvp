'use client';

type LoadingSkeletonProps = {
  variant: 'propertyCard' | 'propertyList' | 'dashboard';
  count?: number;
};

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
      <div className="h-52 w-full animate-pulse rounded-t-3xl bg-slate-800" />
      <div className="space-y-2 px-4 py-3">
        <div className="h-5 w-24 animate-pulse rounded bg-slate-700" />
        <div className="h-3 w-36 animate-pulse rounded bg-slate-700/80" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-700/60" />
      </div>
    </div>
  );
}

function PropertyListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="h-24 flex-1 animate-pulse rounded-2xl bg-slate-800" />
        <div className="h-24 flex-1 animate-pulse rounded-2xl bg-slate-800" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function LoadingSkeleton({ variant, count }: LoadingSkeletonProps) {
  switch (variant) {
    case 'propertyCard':
      return <PropertyCardSkeleton />;
    case 'propertyList':
      return <PropertyListSkeleton count={count ?? 6} />;
    case 'dashboard':
      return <DashboardSkeleton />;
    default:
      return <PropertyListSkeleton count={count ?? 6} />;
  }
}
