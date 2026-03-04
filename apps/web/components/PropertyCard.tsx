'use client';

import Link from 'next/link';

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
  imageUrl?: string | null;
  image_url?: string | null;
  href: string;
  showSave?: boolean;
  saved?: boolean;
  onSaveClick?: (e: React.MouseEvent) => void;
  featured?: boolean;
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
  image_url,
  href,
  showSave,
  saved,
  onSaveClick,
  featured,
}: Props) {
  const displayPrice = price
    ? `$${Number(price).toLocaleString()}`
    : 'Price on request';

  const imgSrc = image_url ?? imageUrl ?? null;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Image: 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden bg-warm-subtle">
        {imgSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={imgSrc} alt={address ?? title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #c8e6c9, #a5d6a7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🏡</div>
        )}
        {featured && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-brand-primary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-inverse)]">
            Featured
          </span>
        )}
        {showSave && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSaveClick?.(e);
            }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label={saved ? 'Unsave home' : 'Save home'}
          >
            {saved ? '❤️' : '🤍'}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-mono text-[22px] font-bold text-[var(--color-text-primary)]">
          {displayPrice}
        </p>
        <p className="mt-1 font-body text-[15px] font-medium text-[var(--color-text-primary)]">
          {address ?? title ?? 'Untitled property'}
        </p>
        {(city || state) && (
          <p className="mt-0.5 font-body text-[13px] text-[var(--color-text-muted)]">
            {city ?? ''}{city && state ? ', ' : ''}{state ?? ''}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0 font-body text-[13px] text-[var(--color-text-muted)]">
          <span>🛏 {beds ?? '—'} bd</span>
          <span>🛁 {baths ?? '—'} ba</span>
          <span>{sqft != null ? `${sqft.toLocaleString()} sqft` : '—'}</span>
        </div>
        <span className="mt-4 block w-full rounded-lg bg-[var(--color-brand-primary)] py-2.5 text-center font-body text-sm font-semibold text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-primary-light)] transition-colors">
          View home
        </span>
      </div>
    </Link>
  );
}
