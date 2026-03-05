// Schema verified against SCHEMA.md - 2025-03-01
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { PIPELINE_STAGES } from '@/lib/pipeline-stages';

const supabase = getSupabaseClient();

const ADMIN_EMAILS = ['admin@homebase.com', 'admin@example.com'];

type Tab = 'properties' | 'users' | 'offers' | 'kyc' | 'deals';

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
  fullName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string | null;
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
  submission_type: string | null;
  full_name: string | null;
  proof_type: string | null;
  id_front_url: string | null;
  proof_url: string | null;
  submitted_at: string | null;
  created_at: string | null;
  user_email: string | null;
};

type DealRow = {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  agreed_price: number | null;
  status: string;
  lender_id: string | null;
  created_at: string | null;
  property_address: string | null;
  buyer_email: string | null;
  seller_email: string | null;
  lender_name: string | null;
  pipeline_stage: string | null;
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
  const [kycStatusFilter, setKycStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [rejectModal, setRejectModal] = useState<{ id: string; user_id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deals, setDeals] = useState<DealRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      const email = user.email ?? '';
      const inAllowlist = ADMIN_EMAILS.includes(email);
      const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).maybeSingle();
      const isAdmin = (profile as { is_admin: boolean | null } | null)?.is_admin;
      if (!inAllowlist && isAdmin === false) {
        router.replace('/dashboard');
        return;
      }
      setEmail(email);
      setError(null);

      try {
        const [propRes, profilesRes, offersRes, kycRes] = await Promise.all([
          supabase.from('properties').select('id, address, city, state, price, status').order('createdAt', { ascending: false }),
          supabase.from('users').select('id, fullName, email, phone, createdAt').order('createdAt', { ascending: false }),
          supabase.from('offers').select('id, userId, property_id, offerPrice, status').order('createdAt', { ascending: false }),
          supabase.from('kyc_submissions').select('id, user_id, status, submission_type, full_name, proof_type, id_front_url, proof_url, submitted_at, created_at').order('created_at', { ascending: false }),
        ]);

        if (propRes.error) throw propRes.error;
        setProperties((propRes.data ?? []) as PropertyRow[]);

        if (profilesRes.error) throw profilesRes.error;
        setUsers((profilesRes.data ?? []) as ProfileRow[]);

        if (offersRes.error) throw offersRes.error;
        const offerList = (offersRes.data ?? []) as { id: string; userId: string; property_id: string | null; offerPrice: number | null; status: string | null }[];
        const userIds = Array.from(new Set(offerList.map((o) => o.userId)));
        const propIds = Array.from(new Set(offerList.map((o) => o.property_id).filter(Boolean))) as string[];
        const [profsRes, propsRes] = await Promise.all([
          userIds.length > 0 ? supabase.from('users').select('id, email').in('id', userIds) : Promise.resolve({ data: [] }),
          propIds.length > 0 ? supabase.from('properties').select('id, address').in('id', propIds) : Promise.resolve({ data: [] }),
        ]);
        const profileMap = new Map((profsRes.data ?? []).map((p: { id: string; email: string | null }) => [p.id, p.email ?? '']));
        const propMap = new Map((propsRes.data ?? []).map((p: { id: string; address: string | null }) => [p.id, p.address]));
        setOffers(offerList.map((o) => ({
          id: o.id,
          user_id: o.userId,
          property_id: o.property_id,
          price: o.offerPrice,
          status: o.status,
          property_address: o.property_id ? propMap.get(o.property_id) ?? null : null,
          buyer_email: profileMap.get(o.userId) ?? null,
        })));

        if (kycRes.error) {
          setKyc([]);
        } else {
          const kycList = (kycRes.data ?? []) as KycRow[];
          const kycUserIds = Array.from(new Set(kycList.map((k) => k.user_id)));
          const kycProfileMap = new Map<string, string>();
          if (kycUserIds.length > 0) {
            const { data: kp } = await supabase.from('users').select('id, email').in('id', kycUserIds);
            (kp ?? []).forEach((p: { id: string; email: string | null }) => { kycProfileMap.set(p.id, p.email ?? ''); });
          }
          setKyc(kycList.map((k) => ({ ...k, user_email: kycProfileMap.get(k.user_id) ?? null })));
        }

        const dealsRes = await supabase.from('deals').select('id, property_id, buyer_id, seller_id, agreed_price, status, lender_id, created_at').order('created_at', { ascending: false });
        if (dealsRes.error) throw dealsRes.error;
        const dealList = (dealsRes.data ?? []) as DealRow[];
        if (dealList.length > 0) {
          const propIds = [...new Set(dealList.map((d) => d.property_id))];
          const buyerSellerIds = [...new Set([...dealList.map((d) => d.buyer_id), ...dealList.map((d) => d.seller_id)])];
          const lenderIds = dealList.map((d) => d.lender_id).filter(Boolean) as string[];
          const [propData, profileData, lenderData, pipelineData] = await Promise.all([
            supabase.from('properties').select('id, address').in('id', propIds),
            supabase.from('users').select('id, email').in('id', buyerSellerIds),
            lenderIds.length > 0 ? supabase.from('lenders').select('id, name').in('id', lenderIds) : Promise.resolve({ data: [] }),
            supabase.from('buying_pipelines').select('user_id, property_id, current_stage').in('property_id', propIds),
          ]);
          const propMap = new Map((propData.data ?? []).map((p: { id: string; address: string | null }) => [p.id, p.address]));
          const profileMap = new Map((profileData.data ?? []).map((p: { id: string; email: string | null }) => [p.id, p.email ?? '']));
          const lenderMap = new Map((lenderData.data ?? []).map((l: { id: string; name: string | null }) => [l.id, l.name ?? '']));
          const pipelineMap = new Map((pipelineData.data ?? []).map((p: { user_id: string; property_id: string; current_stage: string }) => [`${p.user_id}:${p.property_id}`, p.current_stage]));
          setDeals(
            dealList.map((d) => ({
              ...d,
              property_address: propMap.get(d.property_id) ?? null,
              buyer_email: profileMap.get(d.buyer_id) ?? null,
              seller_email: profileMap.get(d.seller_id) ?? null,
              lender_name: d.lender_id ? lenderMap.get(d.lender_id) ?? null : null,
              pipeline_stage: pipelineMap.get(`${d.buyer_id}:${d.property_id}`) ?? null,
            }))
          );
        } else {
          setDeals([]);
        }
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

  const setDealStatus = async (dealId: string, status: string) => {
    const { error: err } = await supabase.from('deals').update({ status, updated_at: new Date().toISOString() }).eq('id', dealId);
    if (!err) setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status } : d)));
  };

  const setDealPipelineStage = async (dealId: string, buyerId: string, propertyId: string, stage: string) => {
    const { data: pipes } = await supabase.from('buying_pipelines').select('id').eq('user_id', buyerId).eq('property_id', propertyId);
    const pipe = (pipes ?? [])[0] as { id: string } | undefined;
    if (pipe) {
      await supabase.from('buying_pipelines').update({ current_stage: stage, updated_at: new Date().toISOString() }).eq('id', pipe.id);
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, pipeline_stage: stage } : d)));
    }
  };

  const updateKyc = async (id: string, status: 'APPROVED' | 'REJECTED', userId: string, reviewerNotes?: string) => {
    const payload: { status: string; reviewed_at: string; reviewer_notes?: string } = { status, reviewed_at: new Date().toISOString() };
    if (reviewerNotes != null) payload.reviewer_notes = reviewerNotes;
    const { error } = await supabase.from('kyc_submissions').update(payload).eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    const { error: userUpdateError } = await supabase.from('users').update({ kycStatus: status }).eq('id', userId);
    if (userUpdateError) console.warn('Could not update users.kycStatus:', userUpdateError.message);
    setKyc((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setRejectModal(null);
    setRejectReason('');
    if (status === 'APPROVED' && userId) {
      try {
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'kyc_approved',
            title: 'Identity verified',
            body: 'Your identity has been verified. You can now make offers.',
            link: '/dashboard',
          }),
        });
      } catch {}
    }
    if (status === 'REJECTED' && userId) {
      try {
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'kyc_rejected',
            title: 'Verification not approved',
            body: reviewerNotes ? `Your verification was not approved. Reason: ${reviewerNotes}` : 'Your verification was not approved. Please contact support or resubmit.',
            link: '/verify',
          }),
        });
      } catch {}
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAFAF8]">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <div className="h-12 w-12 animate-pulse rounded-full border-2 border-[#1B4332]/40 mx-auto mt-12" />
        </main>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'properties', label: 'Properties' },
    { id: 'users', label: 'Users' },
    { id: 'offers', label: 'Offers' },
    { id: 'kyc', label: 'KYC Submissions' },
    { id: 'deals', label: 'Deals' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Link href="/dashboard" className="mb-6 inline-block text-xs font-medium text-[#4A4A4A] hover:text-[#1B4332]">
          ← Dashboard
        </Link>
        <h1 className="font-display text-2xl font-semibold text-[#1A1A1A]">Admin</h1>
        <p className="mt-1 text-sm text-[#888888]">{email}</p>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-2 border-b border-[#E8E6E1] bg-white px-2 pb-2 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeTab === tab.id ? 'bg-[#1B4332] text-white' : 'text-[#4A4A4A] hover:text-[#1B4332]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'properties' && (
          <div className="mt-6 space-y-3">
            {properties.length === 0 ? (
              <p className="rounded-2xl border border-[#E8E6E1] bg-white p-8 text-center text-[#888888]">No properties.</p>
            ) : (
              properties.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8E6E1] bg-white px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {p.address ?? '—'}, {p.city}, {p.state}
                    </div>
                    <div className="text-xs text-[#888888]">
                      ${p.price?.toLocaleString() ?? '—'} • <span className={`rounded-full px-2 py-0.5 font-semibold ${p.status === 'ACTIVE' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>{p.status ?? '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#888888]">Status:</span>
                    <button type="button" onClick={() => setPropertyStatus(p.id, 'ACTIVE')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${p.status === 'ACTIVE' ? 'bg-[#1B4332] text-white' : 'bg-white border border-[#E8E6E1] text-[#4A4A4A] hover:text-[#1B4332]'}`}>ACTIVE</button>
                    <button type="button" onClick={() => setPropertyStatus(p.id, 'PENDING_REVIEW')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${p.status === 'PENDING_REVIEW' ? 'bg-[#1B4332] text-white' : 'bg-white border border-[#E8E6E1] text-[#4A4A4A] hover:text-[#1B4332]'}`}>PENDING_REVIEW</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="mt-6 space-y-3">
            {users.length === 0 ? (
              <p className="rounded-2xl border border-[#E8E6E1] bg-white p-8 text-center text-[#888888]">No users yet.</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8E6E1] bg-white px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-[#1A1A1A]">{u.fullName ?? '—'}</div>
                    <div className="text-xs text-[#888888]">{u.email ?? '—'} • {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="mt-6 space-y-3">
            {offers.length === 0 ? (
              <p className="rounded-2xl border border-[#E8E6E1] bg-white p-8 text-center text-[#888888]">No offers.</p>
            ) : (
              offers.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8E6E1] bg-white px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      ${o.price?.toLocaleString() ?? '—'} • {o.property_address ?? '—'}
                    </div>
                    <div className="text-xs text-[#888888]">{o.buyer_email ?? o.user_id} • {o.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setKycStatusFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${kycStatusFilter === f ? 'bg-[#1B4332] text-white' : 'bg-white border border-[#E8E6E1] text-[#4A4A4A] hover:text-[#1B4332]'}`}
                >
                  {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            {kyc.filter((r) => kycStatusFilter === 'all' || r.status === kycStatusFilter).length === 0 ? (
              <p className="rounded-2xl border border-[#E8E6E1] bg-white p-8 text-center text-[#888888]">No KYC submissions.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#E8E6E1] bg-white">
                <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E6E1]">
                      <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Submission ID</th>
                      <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">User email</th>
                      <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Name</th>
                      <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Type</th>
                      <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Proof type</th>
                      <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Status</th>
                      <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Submitted</th>
                      <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Docs</th>
                      <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kyc.filter((r) => kycStatusFilter === 'all' || r.status === kycStatusFilter).map((r) => (
                      <tr key={r.id} className="border-b border-[#E8E6E1] bg-white hover:bg-[#F4F3F0]">
                        <td className="py-3 pr-2 font-mono text-xs text-[#1A1A1A]">{r.id.slice(0, 8)}</td>
                        <td className="py-3 pr-2 text-[#1A1A1A]">{r.user_email ?? r.user_id.slice(0, 8)}</td>
                        <td className="py-3 pr-2 text-[#1A1A1A]">{r.full_name ?? '\u2014'}</td>
                        <td className="py-3 pr-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.submission_type === 'seller' || r.submission_type === 'seller_fsbo' || r.submission_type === 'seller_agent' ? 'bg-[#E0F2FE] text-[#0369A1]' : 'bg-[#F4F3F0] text-[#4A4A4A]'}`}>
                            {r.submission_type === 'seller' ? 'Seller' : r.submission_type === 'seller_fsbo' ? 'FSBO' : r.submission_type === 'seller_agent' ? 'Agent' : 'Buyer'}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-xs text-[#4A4A4A]">{r.proof_type ?? '\u2014'}</td>
                        <td className="py-3 pr-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === 'APPROVED' ? 'bg-[#D1FAE5] text-[#065F46]' : r.status === 'REJECTED' ? 'bg-[#FEE2E2] text-[#991B1B]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-xs text-[#888888]">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : r.created_at ? new Date(r.created_at).toLocaleDateString() : '\u2014'}</td>
                        <td className="py-3 pr-2">
                          {(r.id_front_url || r.proof_url) && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-[#1B4332] hover:text-[#2D6A4F]">View docs</summary>
                              <div className="mt-1 space-y-0.5 text-[#888888]">
                                {r.id_front_url && <div>ID: {r.id_front_url}</div>}
                                {r.proof_url && <div>Proof: {r.proof_url}</div>}
                              </div>
                            </details>
                          )}
                        </td>
                        <td className="py-3 pr-2">
                          {r.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => updateKyc(r.id, 'APPROVED', r.user_id)} className="rounded-lg bg-[#1B4332] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2D6A4F]">Approve</button>
                              <button type="button" onClick={() => setRejectModal({ id: r.id, user_id: r.user_id })} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {rejectModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
                <div className="w-full max-w-md rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-xl">
                  <h3 className="font-display text-lg font-semibold text-[#1A1A1A]">Reject verification</h3>
                  <p className="mt-1 text-sm text-[#888888]">Optionally provide a reason (user will be notified):</p>
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Reason for rejection..." className="mt-3 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#888888]" />
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-sm font-semibold text-[#4A4A4A] hover:bg-[#F4F3F0]">Cancel</button>
                    <button type="button" onClick={() => rejectModal && updateKyc(rejectModal.id, 'REJECTED', rejectModal.user_id, rejectReason.trim() || undefined)} className="flex-1 rounded-xl border border-red-200 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Reject</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[#E8E6E1] bg-white">
            {deals.length === 0 ? (
              <p className="p-8 text-center text-[#888888]">No deals.</p>
            ) : (
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E8E6E1]">
                    <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Deal ID</th>
                    <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Property</th>
                    <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Buyer</th>
                    <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Seller</th>
                    <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Agreed price</th>
                    <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Status</th>
                    <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Lender</th>
                    <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Pipeline stage</th>
                    <th className="py-3 pr-2 text-xs font-semibold uppercase tracking-wide text-[#888888]">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((d) => (
                    <tr key={d.id} className="border-b border-[#E8E6E1] bg-white hover:bg-[#F4F3F0]">
                      <td className="py-3 pr-2 font-mono text-xs text-[#1A1A1A]">{d.id.slice(0, 8)}</td>
                      <td className="py-3 pr-2 text-[#1A1A1A]">{d.property_address ?? '—'}</td>
                      <td className="py-3 pr-2 text-[#1A1A1A]">{d.buyer_email ?? '—'}</td>
                      <td className="py-3 pr-2 text-[#1A1A1A]">{d.seller_email ?? '—'}</td>
                      <td className="py-3 pr-2 text-[#1A1A1A]">{d.agreed_price != null ? `$${d.agreed_price.toLocaleString()}` : '—'}</td>
                      <td className="py-3 pr-2">
                        <select
                          value={d.status}
                          onChange={(e) => setDealStatus(d.id, e.target.value)}
                          className="rounded-lg border border-[#E8E6E1] bg-white px-2 py-1 text-xs font-semibold text-[#1A1A1A]"
                        >
                          <option value="active">Active</option>
                          <option value="closed">Closed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 pr-2 text-[#4A4A4A]">{d.lender_name ?? 'Pending'}</td>
                      <td className="py-3 pr-2">
                        <select
                          value={d.pipeline_stage ?? ''}
                          onChange={(e) => setDealPipelineStage(d.id, d.buyer_id, d.property_id, e.target.value)}
                          className="rounded-lg border border-[#E8E6E1] bg-white px-2 py-1 text-xs text-[#1A1A1A]"
                        >
                          <option value="">—</option>
                          {PIPELINE_STAGES.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-2 text-xs text-[#888888]">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
