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

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
    router.replace('/(tabs)/home');
  };

  if (success) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 px-6">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <Text className="text-3xl">✓</Text>
        </View>
        <Text className="text-center text-xl font-semibold text-white">
          Account created
        </Text>
        <Text className="mt-2 text-center text-sm text-slate-400">
          Check your email to confirm your account, then sign in.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/login')}
          className="mt-8 rounded-2xl bg-emerald-500 px-6 py-3"
        >
          <Text className="text-base font-semibold text-slate-950">Go to sign in</Text>
        </TouchableOpacity>
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
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8">
          <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Join HomeBase
          </Text>
          <Text className="mt-3 text-3xl font-bold text-white">
            Create your account
          </Text>
          <Text className="mt-2 text-sm text-slate-400">
            Save homes, track showings, and stay ahead of the market.
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="mb-2 text-sm font-medium text-slate-200">Full name</Text>
            <TextInput
              value={fullName}
              onChangeText={(t) => { setFullName(t); setError(null); }}
              placeholder="Alex Chen"
              placeholderTextColor="#94a3b8"
              className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3.5 text-base text-slate-50"
            />
          </View>

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

          <View>
            <Text className="mb-2 text-sm font-medium text-slate-200">Phone</Text>
            <TextInput
              value={phone}
              onChangeText={(t) => { setPhone(t); setError(null); }}
              keyboardType="phone-pad"
              placeholder="+1 (555) 000-0000"
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
            onPress={handleRegister}
            activeOpacity={0.9}
            className="mt-2 flex-row items-center justify-center rounded-2xl bg-emerald-500 px-4 py-4 shadow-lg shadow-emerald-500/40"
          >
            {loading ? (
              <ActivityIndicator color="#022c22" />
            ) : (
              <Text className="text-base font-semibold text-slate-950">Create account</Text>
            )}
          </TouchableOpacity>

          <View className="mt-6 flex-row flex-wrap justify-center gap-1">
            <Text className="text-sm text-slate-400">Already have an account?</Text>
            <Link href="/login" asChild>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text className="text-sm font-semibold text-emerald-400">Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
