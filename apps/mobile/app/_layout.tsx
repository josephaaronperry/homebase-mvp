import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import '../global.css';
import { supabase } from '@/lib/supabase';

function RootLayoutNav() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.replace('/(tabs)/home');
        } else if (event === 'SIGNED_OUT') {
          router.replace('/');
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#020617' },
        }}
      />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return <RootLayoutNav />;
}
