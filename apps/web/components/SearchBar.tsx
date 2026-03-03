'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type SearchSuggestion = {
  id: string;
  type: 'city' | 'address';
  display: string;
  city?: string;
  state?: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

type SearchBarProps = {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  onSelect?: (suggestion: SearchSuggestion) => void;
};

export function SearchBar({
  defaultValue = '',
  placeholder = 'City, neighborhood, or address...',
  className = '',
  onSelect,
}: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedValue = useDebounce(value.trim(), 300);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedValue.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/properties/search?q=${encodeURIComponent(debouncedValue)}`
        );
        const json = await res.json();
        const props = (json.properties ?? []) as Array<{
          id: string | number;
          address?: string | null;
          city?: string | null;
          state?: string | null;
        }>;

        const seen = new Set<string>();
        const list: SearchSuggestion[] = [];

        for (const p of props) {
          if (p.city && p.state) {
            const cityKey = `${p.city}, ${p.state}`;
            if (!seen.has(cityKey)) {
              seen.add(cityKey);
              list.push({
                id: `city-${cityKey}`,
                type: 'city',
                display: cityKey,
                city: p.city,
                state: p.state,
              });
            }
          }
          if (p.address) {
            const addrKey = `${p.address}${p.city ? `, ${p.city}` : ''}`;
            if (!seen.has(addrKey)) {
              seen.add(addrKey);
              list.push({
                id: `addr-${p.id}`,
                type: 'address',
                display: addrKey,
                city: p.city ?? undefined,
                state: p.state ?? undefined,
              });
            }
          }
        }

        setSuggestions(list.slice(0, 8));
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    };

    fetchSuggestions();
  }, [debouncedValue]);

  const handleSelect = useCallback(
    (s: SearchSuggestion) => {
      setValue(s.display);
      setOpen(false);
      if (onSelect) {
        onSelect(s);
      } else {
        router.push(`/properties?q=${encodeURIComponent(s.display)}`);
      }
    },
    [onSelect, router]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    if (value.trim()) {
      router.push(`/properties?q=${encodeURIComponent(value.trim())}`);
    } else {
      router.push('/properties');
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="search"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => debouncedValue.length >= 2 && setOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-5 py-3.5 pl-12 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          {loading && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-emerald-500" />
            </span>
          )}
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl border border-slate-800 bg-slate-950 py-2 shadow-xl">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800/80"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                {s.type === 'city' ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                )}
              </span>
              <span>{s.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
