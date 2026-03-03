'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  PIPELINE_STAGES,
  getStageStatus,
  getCtaForStage,
} from '@/lib/pipeline-stages';

const supabase = getSupabaseClient();

type Pipeline = {
  id: string;
  property_id: string;
  offer_id: string | null;
  current_stage: string;
  stage_completed_at: Record<string, string>;
  created_at: string;
  updated_at: string;
};

type Property = {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  image_url: string | null;
};

export default function BuyingPipelinePage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.propertyId as string;
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      if (!propertyId) {
        setLoading(false);
        return;
      }
      const [pipeRes, propRes] = await Promise.all([
        supabase
          .from('buying_pipelines')
          .select('id, property_id, offer_id, current_stage, stage_completed_at, created_at, updated_at')
          .eq('user_id', user.id)
          .eq('property_id', propertyId)
          .maybeSingle(),
        supabase
          .from('properties')
          .select('id, title, address, city, state, price, image_url')
          .eq('id', propertyId)
          .maybeSingle(),
      ]);
      setPipeline((pipeRes.data ?? null) as Pipeline | null);
      setProperty((propRes.data ?? null) as Property | null);
      setLoading(false);
    };
    load();
  }, [propertyId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  if (!propertyId || !property) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-2xl px-4 py-12">
          <p className="text-slate-400">Property not found.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300">
            ← Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-2xl px-4 py-12">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <h1 className="text-lg font-semibold text-slate-50">No active transaction</h1>
            <p className="mt-2 text-sm text-slate-400">
              You don’t have a buying pipeline for this property yet. Submit an offer to start tracking your purchase.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href={`/offers/new?propertyId=${propertyId}`}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Make an offer
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const completedAt = (pipeline.stage_completed_at || {}) as Record<string, string>;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400"
        >
          ← Dashboard
        </Link>

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex gap-4">
            <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-800">
              {property.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={property.image_url} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-slate-50">{property.address ?? property.title}</h1>
              <p className="text-sm text-slate-400">
                {property.city}, {property.state}
              </p>
              {property.price != null && (
                <p className="mt-1 text-sm font-semibold text-emerald-400">
                  ${property.price.toLocaleString()}
                </p>
              )}
              <Link
                href={`/properties/${property.id}`}
                className="mt-2 inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                View property →
              </Link>
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Buying pipeline
        </h2>

        <div className="space-y-3">
          {PIPELINE_STAGES.map((stage, index) => {
            const status = getStageStatus(stage.id, pipeline.current_stage, completedAt);
            const cta = getCtaForStage(stage.id, propertyId);
            const completedDate = completedAt[stage.id];

            return (
              <div
                key={stage.id}
                className={`rounded-2xl border p-4 ${
                  status === 'active'
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : status === 'complete'
                      ? 'border-slate-700 bg-slate-900/50'
                      : 'border-slate-800 bg-slate-950/80'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        status === 'complete'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : status === 'active'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {status === 'complete' ? '✓' : index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-50">{stage.label}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            status === 'complete'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : status === 'active'
                                ? 'bg-emerald-500/30 text-emerald-200'
                                : 'bg-slate-700/60 text-slate-500'
                          }`}
                        >
                          {status === 'complete' ? 'Complete' : status === 'active' ? 'Active' : 'Pending'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{stage.description}</p>
                      {completedDate && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Completed {new Date(completedDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  {status === 'active' && cta && (
                    <Link
                      href={cta.href}
                      className="flex-shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                    >
                      {cta.label}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300"
          >
            Back to dashboard
          </Link>
          <Link
            href="/offers"
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300"
          >
            View all offers
          </Link>
        </div>
      </main>
    </div>
  );
}
