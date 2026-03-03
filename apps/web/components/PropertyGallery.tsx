'use client';

import { useState } from 'react';

type Props = {
  imageUrl: string | null;
  propertyId: string | number;
  title: string | null;
};

const PLACEHOLDER = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80';

function buildThumbnails(base: string, id: string | number): string[] {
  const u = base || PLACEHOLDER;
  const seed = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const params = [
    '&sat=-10&w=400',
    '&brightness=110&w=400',
    '&blur=0&w=400',
    '&fit=crop&w=400&h=300',
    '&q=70&w=400',
    '&w=400',
  ];
  return params.map((p, i) => `${u.replace(/\?.*/, '')}?auto=format&fit=crop&w=800&q=80${p}`);
}

export function PropertyGallery({ imageUrl, propertyId, title }: Props) {
  const base = imageUrl || PLACEHOLDER;
  const thumbs = buildThumbnails(base, propertyId);
  const [selected, setSelected] = useState(0);
  const displayImages = [base, ...thumbs.slice(1, 6)];

  return (
    <div className="space-y-3">
      <div className="relative h-72 w-full overflow-hidden sm:h-80 md:h-96">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImages[selected]}
          alt={title ?? 'Property'}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {displayImages.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-slate-800 ${
              selected === i ? 'border-emerald-500' : 'border-transparent hover:border-slate-600'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
