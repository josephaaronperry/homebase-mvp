'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Props = {
  id: string | number;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  imageUrl: string | null;
  href: string;
  showSave?: boolean;
  saved?: boolean;
  onSaveClick?: (e: React.MouseEvent) => void;
};

export function PropertyCard({
  title,
  address,
  city,
  state,
  price,
  beds,
  baths,
  sqft,
  imageUrl,
  href,
  showSave,
  saved,
  onSaveClick,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const displayPrice = price
    ? `$${Number(price).toLocaleString()}`
    : 'Price on request';

  const badge = `${beds ?? '-'} bd • ${baths ?? '-'} ba • ${
    sqft ? `${sqft.toLocaleString()} sqft` : '-'
  }`;

  const img =
    imageUrl ??
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80&sat=-10';

  const cardContent = (
    <>
      <Link
        href={href}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-900 bg-slate-950/80 shadow-md shadow-black/40 transition hover:border-emerald-400/70 hover:shadow-xl hover:shadow-emerald-500/10"
      >
        <div className="relative h-40 w-full bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={title ?? ''}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-950">
            Active
          </span>
          {showSave && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onSaveClick?.(e);
              }}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-slate-50 hover:bg-black"
              aria-label={saved ? 'Unsave home' : 'Save home'}
            >
              {saved ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3 text-xs text-slate-300">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-lg font-semibold text-slate-50">
            {displayPrice}
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
            {badge}
          </div>
        </div>
        <div className="mt-2 text-sm font-medium text-slate-100">
          {title ?? 'Untitled property'}
        </div>
        <div className="mt-0.5 text-[11px] text-slate-400">
          {address}
          {city || state
            ? ` • ${city ?? ''}${city && state ? ', ' : ''}${state ?? ''}`
            : ''}
        </div>
      </div>
      </Link>
    </>
  );

  if (!mounted) {
    return <div className="h-full">{cardContent}</div>;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="h-full"
    >
      {cardContent}
    </motion.div>
  );
}

