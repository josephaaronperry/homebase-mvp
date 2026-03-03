import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace('/(tabs)/home');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-950"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-10">
          <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Welcome back
          </Text>
          <Text className="mt-3 text-3xl font-bold text-white">
            Sign in to HomeBase
          </Text>
          <Text className="mt-2 text-sm text-slate-400">
            Access your saved homes, showings, and personalized recommendations.
          </Text>
        </View>

        <View className="gap-5">
          <View>
            <Text className="mb-2 text-sm font-medium text-slate-200">Email</Text>
            <TextInput
              value={email}
              onChangeText={(t) => { setEmail(t); setError(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
              className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3.5 text-base text-slate-50"
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-slate-200">Password</Text>
            <TextInput
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3.5 text-base text-slate-50"
            />
          </View>

          {error ? (
            <View className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3">
              <Text className="text-sm text-rose-300">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            disabled={loading}
            onPress={handleLogin}
            activeOpacity={0.9}
            className="mt-2 flex-row items-center justify-center rounded-2xl bg-emerald-500 px-4 py-4 shadow-lg shadow-emerald-500/40"
          >
            {loading ? (
              <ActivityIndicator color="#022c22" />
            ) : (
              <Text className="text-base font-semibold text-slate-950">Sign in</Text>
            )}
          </TouchableOpacity>

          <View className="mt-6 flex-row flex-wrap justify-center gap-1">
            <Text className="text-sm text-slate-400">New to HomeBase?</Text>
            <Link href="/register" asChild>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text className="text-sm font-semibold text-emerald-400">
                  Create an account
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
