'use client';

import { AnimatedCounter } from '@/components/AnimatedCounter';

export function HomepageStats({ listingCount }: { listingCount: number }) {
  return (
    <dl className="mt-8 grid grid-cols-3 gap-4 max-sm:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
        <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
          Active listings
        </dt>
        <dd className="mt-1 text-2xl font-semibold text-slate-50">
          <AnimatedCounter value={Math.max(listingCount, 1)} duration={1.8} />
        </dd>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
        <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
          Cities covered
        </dt>
        <dd className="mt-1 text-2xl font-semibold text-slate-50">
          <AnimatedCounter value={10} duration={1.2} />
        </dd>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 max-sm:col-span-2">
        <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
          Digital process
        </dt>
        <dd className="mt-1 text-2xl font-semibold text-slate-50">100%</dd>
      </div>
    </dl>
  );
}
