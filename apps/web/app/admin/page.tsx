'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

const ADMIN_EMAILS = ['admin@homebase.com', 'admin@example.com'];

type Tab = 'properties' | 'users' | 'offers' | 'kyc';

type PropertyRow = {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  status: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
};

type OfferRow = {
  id: string;
  user_id: string;
  property_id: string | null;
  price: number | null;
  status: string | null;
  property_address: string | null;
  buyer_email: string | null;
};

type KycRow = {
  id: string;
  user_id: string;
  status: string;
  full_name: string | null;
  submitted_at: string | null;
  created_at: string | null;
  user_email: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('properties');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [kyc, setKyc] = useState<KycRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      if (!ADMIN_EMAILS.includes(user.email ?? '')) {
        router.replace('/dashboard');
        return;
      }
      setEmail(user.email ?? null);
      setError(null);

      try {
        const [propRes, profilesRes, offersRes, kycRes] = await Promise.all([
          supabase.from('properties').select('id, address, city, state, price, status').order('created_at', { ascending: false }),
          supabase.from('profiles').select('id, full_name, email, phone, created_at').order('created_at', { ascending: false }),
          supabase.from('offers').select('id, user_id, property_id, price, status, property_address').order('created_at', { ascending: false }),
          supabase.from('kyc_submissions').select('id, user_id, status, full_name, submitted_at, created_at').order('created_at', { ascending: false }),
        ]);

        if (propRes.error) throw propRes.error;
        setProperties((propRes.data ?? []) as PropertyRow[]);

        if (profilesRes.error) throw profilesRes.error;
        setUsers((profilesRes.data ?? []) as ProfileRow[]);

        if (offersRes.error) throw offersRes.error;
        const offerList = (offersRes.data ?? []) as OfferRow[];
        const userIds = Array.from(new Set(offerList.map((o) => o.user_id)));
        const profileMap = new Map<string, string>();
        if (userIds.length > 0) {
          const { data: profs } = await supabase.from('profiles').select('id, email').in('id', userIds);
          (profs ?? []).forEach((p: { id: string; email: string | null }) => { profileMap.set(p.id, p.email ?? ''); });
        }
        setOffers(offerList.map((o) => ({ ...o, buyer_email: profileMap.get(o.user_id) ?? null })));

        if (kycRes.error) throw kycRes.error;
        const kycList = (kycRes.data ?? []) as KycRow[];
        const kycUserIds = Array.from(new Set(kycList.map((k) => k.user_id)));
        const kycProfileMap = new Map<string, string>();
        if (kycUserIds.length > 0) {
          const { data: kp } = await supabase.from('profiles').select('id, email').in('id', kycUserIds);
          (kp ?? []).forEach((p: { id: string; email: string | null }) => { kycProfileMap.set(p.id, p.email ?? ''); });
        }
        setKyc(kycList.map((k) => ({ ...k, user_email: kycProfileMap.get(k.user_id) ?? null })));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const setPropertyStatus = async (id: string, status: string) => {
    const { error: err } = await supabase.from('properties').update({ status }).eq('id', id);
    if (!err) setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const updateKyc = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await supabase.from('kyc_submissions').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
    setKyc((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40 mx-auto mt-12" />
        </main>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'properties', label: 'Properties' },
    { id: 'users', label: 'Users' },
    { id: 'offers', label: 'Offers' },
    { id: 'kyc', label: 'KYC Submissions' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Link href="/dashboard" className="mb-6 inline-block text-xs font-medium text-slate-400 hover:text-emerald-400">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-slate-50">Admin</h1>
        <p className="mt-1 text-sm text-slate-400">{email}</p>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-2 border-b border-slate-800 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'properties' && (
          <div className="mt-6 space-y-3">
            {properties.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">No properties.</p>
            ) : (
              properties.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-100">
                      {p.address ?? '—'}, {p.city}, {p.state}
                    </div>
                    <div className="text-xs text-slate-500">
                      ${p.price?.toLocaleString() ?? '—'} • <span className={`rounded-full px-2 py-0.5 font-semibold ${p.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{p.status ?? '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <button type="button" onClick={() => setPropertyStatus(p.id, 'ACTIVE')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${p.status === 'ACTIVE' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>ACTIVE</button>
                    <button type="button" onClick={() => setPropertyStatus(p.id, 'PENDING_REVIEW')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${p.status === 'PENDING_REVIEW' ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>PENDING_REVIEW</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="mt-6 space-y-3">
            {users.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">No users in profiles yet.</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-100">{u.full_name ?? '—'}</div>
                    <div className="text-xs text-slate-500">{u.email ?? '—'} • {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="mt-6 space-y-3">
            {offers.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">No offers.</p>
            ) : (
              offers.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-100">
                      ${o.price?.toLocaleString() ?? '—'} • {o.property_address ?? '—'}
                    </div>
                    <div className="text-xs text-slate-500">{o.buyer_email ?? o.user_id} • {o.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="mt-6 space-y-3">
            {kyc.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">No KYC submissions.</p>
            ) : (
              kyc.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-100">{r.full_name ?? r.id}</div>
                    <div className="text-xs text-slate-500">{r.user_email ?? r.user_id} • {r.status} • {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</div>
                  </div>
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => updateKyc(r.id, 'APPROVED')} className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30">Approve</button>
                      <button type="button" onClick={() => updateKyc(r.id, 'REJECTED')} className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30">Reject</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
