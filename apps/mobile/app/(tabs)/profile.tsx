import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/');
      return;
    }

    const meta = user.user_metadata as { full_name?: string; phone?: string } | undefined;
    setFullName(meta?.full_name ?? '');
    setPhone(meta?.phone ?? '');
    setEmail(user.email ?? '');
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
      },
    });

    if (updateError) {
      setError(updateError.message ?? 'Failed to update profile');
    } else {
      setSuccess(true);
    }
    setSaving(false);
  }, [fullName, phone]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace('/');
  }, [router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#22c55e" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-950"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pt-14">
          <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Account
          </Text>
          <Text className="mt-2 text-2xl font-bold text-white">
            Profile
          </Text>
        </View>

        <View className="mt-8 px-6">
          <View className="mb-6 flex-row items-center gap-4">
            <View className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
              <Text className="text-2xl font-semibold text-slate-300">
                {fullName?.[0]?.toUpperCase() ?? 'U'}
              </Text>
            </View>
            <View>
              <Text className="text-base font-semibold text-white">
                {fullName || 'Your name'}
              </Text>
              <Text className="text-sm text-slate-400">{email}</Text>
            </View>
          </View>

          {error ? (
            <View className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3">
              <Text className="text-sm text-rose-300">{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
              <Text className="text-sm text-emerald-200">Profile updated successfully.</Text>
            </View>
          ) : null}

          <View className="gap-4">
            <View>
              <Text className="mb-2 text-sm font-medium text-slate-200">Full name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your name"
                placeholderTextColor="#64748b"
                className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100"
              />
            </View>
            <View>
              <Text className="mb-2 text-sm font-medium text-slate-200">Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="#64748b"
                className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100"
              />
            </View>
            <View>
              <Text className="mb-2 text-sm font-medium text-slate-200">Email</Text>
              <TextInput
                value={email}
                editable={false}
                className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-base text-slate-400"
              />
              <Text className="mt-1 text-xs text-slate-500">
                Email cannot be changed here
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="mt-4 flex-row items-center justify-center rounded-2xl bg-emerald-500 py-3.5"
            >
              {saving ? (
                <ActivityIndicator color="#022c22" size="small" />
              ) : (
                <Text className="text-base font-semibold text-slate-950">Save changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-12 px-6">
          <TouchableOpacity
            onPress={handleSignOut}
            className="w-full items-center justify-center rounded-2xl border border-slate-700 py-3.5"
          >
            <Text className="text-base font-semibold text-slate-200">Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
