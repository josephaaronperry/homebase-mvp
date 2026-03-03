import { useCallback, useEffect, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

type Showing = {
  id: string | number;
  property_address?: string | null;
  property_city?: string | null;
  property_state?: string | null;
  scheduled_at?: string | null;
  status?: string | null;
};

export default function ShowingsScreen() {
  const router = useRouter();
  const [showings, setShowings] = useState<Showing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/');
      return;
    }

    const { data } = await supabase
      .from('showings')
      .select('id, property_address, property_city, property_state, scheduled_at, status')
      .order('scheduled_at', { ascending: true });

    setShowings((data ?? []) as Showing[]);
    setLoading(false);
    setRefreshing(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleCancel = useCallback(async (id: string | number) => {
    await supabase
      .from('showings')
      .update({ status: 'CANCELLED' })
      .eq('id', id);
    setShowings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'CANCELLED' } : s))
    );
  }, []);

  const statusBadge = (status?: string | null) => {
    if (status === 'CONFIRMED') return 'bg-emerald-500/20';
    if (status === 'PENDING') return 'bg-sky-500/20';
    if (status === 'CANCELLED') return 'bg-rose-500/20';
    return 'bg-slate-700/60';
  };

  const statusText = (status?: string | null) => {
    if (status === 'CONFIRMED') return 'text-emerald-300';
    if (status === 'PENDING') return 'text-sky-300';
    if (status === 'CANCELLED') return 'text-rose-300';
    return 'text-slate-200';
  };

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }) : '—';

  if (loading && showings.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#22c55e" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950 pt-14">
      <View className="mb-4 px-6">
        <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Tours
        </Text>
        <Text className="mt-2 text-2xl font-bold text-white">
          Upcoming showings
        </Text>
        <Text className="mt-1 text-sm text-slate-400">
          Schedule and manage your property tours
        </Text>
      </View>

      {showings.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-5xl">📅</Text>
          <Text className="mb-2 text-center text-lg font-semibold text-white">
            No showings scheduled
          </Text>
          <Text className="mb-8 text-center text-sm text-slate-400">
            Schedule a tour from any property detail page.
          </Text>
          <Link href="/(tabs)/search" asChild>
            <TouchableOpacity className="rounded-2xl bg-emerald-500 px-6 py-3">
              <Text className="text-base font-semibold text-slate-950">
                Browse homes
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#22c55e"
            />
          }
        >
          {showings.map((s) => (
            <View
              key={s.id}
              className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-slate-100">
                    {s.property_address ?? 'Property'}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    {s.property_city}, {s.property_state}
                  </Text>
                  <Text className="mt-2 text-xs text-slate-400">
                    {fmtDate(s.scheduled_at)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View
                    className={`rounded-full px-3 py-1 ${statusBadge(s.status)}`}
                  >
                    <Text className={`text-[11px] font-semibold uppercase tracking-wider ${statusText(s.status)}`}>
                      {s.status ?? 'SCHEDULED'}
                    </Text>
                  </View>
                  {s.status !== 'CANCELLED' && (
                    <TouchableOpacity
                      onPress={() => handleCancel(s.id)}
                      className="rounded-full border border-rose-500/60 px-3 py-1"
                    >
                      <Text className="text-[11px] font-semibold text-rose-300">
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
