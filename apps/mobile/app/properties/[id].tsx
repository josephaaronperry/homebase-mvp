import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

type Property = {
  id: string | number;
  title?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  image_url?: string | null;
  gallery_urls?: string[] | null;
  description?: string | null;
};

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80';

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [tourModalVisible, setTourModalVisible] = useState(false);
  const [tourDate, setTourDate] = useState(new Date());

  const images: string[] =
    property?.gallery_urls?.length && property.gallery_urls.length > 0
      ? property.gallery_urls
      : property?.image_url
        ? [property.image_url]
        : [PLACEHOLDER];

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: savedData } = await supabase
          .from('saved_properties')
          .select('id')
          .eq('property_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        setSaved(!!savedData);
      }

      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setProperty((data ?? null) as Property | null);
      }
      setLoading(false);
    };

    if (id) load();
  }, [id]);

  const toggleSave = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setSaving(true);
    if (saved) {
      await supabase
        .from('saved_properties')
        .delete()
        .eq('property_id', id)
        .eq('user_id', user.id);
      setSaved(false);
    } else {
      await supabase.from('saved_properties').insert({
        property_id: id,
        user_id: user.id,
      });
      setSaved(true);
    }
    setSaving(false);
  }, [saved, id, router]);

  const scheduleTour = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    await supabase.from('showings').insert({
      property_id: id,
      user_id: user.id,
      property_address: property?.address ?? property?.title ?? 'Address',
      property_city: property?.city ?? '',
      property_state: property?.state ?? '',
      scheduled_at: tourDate.toISOString(),
      status: 'PENDING',
    });
    setTourModalVisible(false);
    router.push('/(tabs)/showings');
  }, [id, property, tourDate, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#22c55e" size="large" />
      </View>
    );
  }

  if (error || !property) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 px-6">
        <Text className="mb-2 text-lg font-semibold text-white">Property not found</Text>
        <Text className="mb-6 text-center text-sm text-slate-400">
          {error ?? 'We could not load this property.'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-2.5"
        >
          <Text className="text-sm font-semibold text-slate-100">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const price = property.price
    ? `$${Number(property.price).toLocaleString()}`
    : 'Price on request';
  const badge = `${property.beds ?? '-'} bd • ${property.baths ?? '-'} ba • ${
    property.sqft ? `${property.sqft.toLocaleString()} sqft` : '-'
  }`;

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="relative h-72 w-full bg-slate-800">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setGalleryIndex(idx);
            }}
            style={{ height: 288 }}
          >
            {images.map((uri, i) => (
              <Image
                key={`${uri}-${i}`}
                source={{ uri }}
                style={{ width, height: 288 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {images.length > 1 && (
            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-2">
              {images.map((_, i) => (
                <View
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === galleryIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-4 top-12 rounded-full bg-slate-900/80 px-3 py-2"
          >
            <Text className="text-xs font-semibold text-slate-100">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleSave}
            disabled={saving}
            className="absolute right-4 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80"
          >
            <Text className="text-lg">{saved ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 pt-5">
          <Text className="text-3xl font-bold text-white">{price}</Text>
          <Text className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            {badge}
          </Text>
          <Text className="mt-3 text-lg font-semibold text-slate-50">
            {property.title ?? 'Untitled property'}
          </Text>
          <Text className="mt-1 text-sm text-slate-400">
            {property.address}
            {(property.city || property.state) &&
              ` • ${property.city ?? ''}${property.city && property.state ? ', ' : ''}${property.state ?? ''}`}
          </Text>

          {property.description ? (
            <View className="mt-6">
              <Text className="text-sm font-semibold text-slate-100">
                About this home
              </Text>
              <Text className="mt-2 text-sm leading-relaxed text-slate-300">
                {property.description}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/98 px-6 pb-10 pt-4">
        <TouchableOpacity
          onPress={() => setTourModalVisible(true)}
          className="mb-3 w-full items-center justify-center rounded-2xl bg-emerald-500 py-3.5 shadow-lg shadow-emerald-500/30"
        >
          <Text className="text-base font-semibold text-slate-950">Schedule tour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleSave}
          disabled={saving}
          className="w-full items-center justify-center rounded-2xl border border-slate-700 py-3"
        >
          <Text className="text-base font-semibold text-slate-200">
            {saved ? 'Saved' : 'Save to favorites'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={tourModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTourModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setTourModalVisible(false)}
          className="flex-1 justify-end bg-black/60"
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="rounded-t-3xl border-t border-slate-800 bg-slate-950 px-6 pb-10 pt-6">
              <Text className="text-lg font-bold text-white">Choose date & time</Text>
              <View className="mt-4">
                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={tourDate}
                    mode="datetime"
                    display="spinner"
                    minimumDate={new Date()}
                    onChange={(_, d) => d && setTourDate(d)}
                    textColor="#f8fafc"
                  />
                ) : (
                  <DateTimePicker
                    value={tourDate}
                    mode="datetime"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(_, d) => {
                      if (d) setTourDate(d);
                      setTourModalVisible(false);
                    }}
                  />
                )}
              </View>
              <TouchableOpacity
                onPress={scheduleTour}
                className="mt-6 w-full items-center justify-center rounded-2xl bg-emerald-500 py-3.5"
              >
                <Text className="text-base font-semibold text-slate-950">
                  Confirm tour
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
