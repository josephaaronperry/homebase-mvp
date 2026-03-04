'use client';

export function HomepageStats({ listingCount }: { listingCount: number }) {
  return (
    <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
        <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
          5–6% avg commission
        </dt>
        <dd className="mt-1 text-xl font-semibold text-slate-50 sm:text-2xl">
          Traditional
        </dd>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
        <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
          $15,000+ avg savings
        </dt>
        <dd className="mt-1 text-xl font-semibold text-emerald-300 sm:text-2xl">
          $15,000+
        </dd>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
        <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
          9-stage guided process
        </dt>
        <dd className="mt-1 text-xl font-semibold text-slate-50 sm:text-2xl">
          9 stages
        </dd>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
        <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
          0 agents needed
        </dt>
        <dd className="mt-1 text-xl font-semibold text-slate-50 sm:text-2xl">
          0
        </dd>
      </div>
    </dl>
  );
}
