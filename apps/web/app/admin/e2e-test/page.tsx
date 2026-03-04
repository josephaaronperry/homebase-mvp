'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();
const ADMIN_EMAILS = ['admin@homebase.com', 'admin@example.com'];
const E2E_STORAGE_KEY = 'homebase_e2e_checklist';

const E2E_STEPS = [
  { id: '1', label: 'Seller creates listing', href: '/sell/list' },
  { id: '2', label: 'Listing appears on browse', href: '/properties' },
  { id: '3', label: 'Buyer completes KYC', href: '/verify' },
  { id: '4', label: 'Buyer submits offer', href: '/properties' },
  { id: '5', label: 'Seller receives notification', href: '/sell/dashboard' },
  { id: '6', label: 'Seller accepts offer', href: '/sell/dashboard' },
  { id: '7', label: 'Buyer notified of acceptance', href: '/dashboard/offers' },
  { id: '8', label: 'Buyer directed to lenders', href: '/dashboard/lenders' },
  { id: '9', label: 'Buyer selects lender', href: '/dashboard/lenders' },
  { id: '10', label: 'Both see pipeline', href: '/dashboard', subHref: '/sell/dashboard' },
  { id: '11', label: 'Admin shows deal + lender + status', href: '/admin' },
];

function loadStored(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(E2E_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {}
  return {};
}

function saveStored(checked: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(E2E_STORAGE_KEY, JSON.stringify(checked));
  } catch {}
}

export default function AdminE2eTestPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setAllowed(ADMIN_EMAILS.includes(user.email ?? ''));
      if (!ADMIN_EMAILS.includes(user.email ?? '')) {
        router.replace('/dashboard');
        return;
      }
      setChecked(loadStored());
    };
    check();
  }, [router]);

  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    saveStored(next);
  };

  const clearAll = () => {
    setChecked({});
    saveStored({});
  };

  if (allowed === null || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <Link href="/admin" className="mb-6 inline-block text-xs font-medium text-slate-400 hover:text-emerald-400">
          ← Admin
        </Link>
        <h1 className="text-2xl font-semibold text-slate-50">MVP end-to-end test checklist</h1>
        <p className="mt-1 text-sm text-slate-400">
          Work through each step. Checkbox state is saved in this browser.
        </p>
        <button
          type="button"
          onClick={clearAll}
          className="mt-4 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800"
        >
          Clear all
        </button>
        <ul className="mt-6 space-y-3">
          {E2E_STEPS.map((step) => (
            <li key={step.id} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3">
              <label className="flex shrink-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!checked[step.id]}
                  onChange={() => toggle(step.id)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500"
                />
                <span className="text-sm font-medium text-slate-200">{step.label}</span>
              </label>
              <div className="min-w-0 flex-1 text-right">
                <Link href={step.href} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300" target="_blank" rel="noopener noreferrer">
                  Open →
                </Link>
                {step.subHref && (
                  <>
                    <span className="mx-1 text-slate-600">|</span>
                    <Link href={step.subHref} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300" target="_blank" rel="noopener noreferrer">
                      Seller view →
                    </Link>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
