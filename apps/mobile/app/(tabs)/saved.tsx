import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { PropertyCard } from '@/components/PropertyCard';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

type SavedProperty = {
  id: string | number;
  property_id: string | number;
  price: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  image_url?: string | null;
  title?: string | null;
};

function SwipeableSavedCard({
  item,
  onRemove,
  cardWidth,
}: {
  item: SavedProperty;
  onRemove: () => void;
  cardWidth: number;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <TouchableOpacity
      onPress={() => {
        swipeRef.current?.close();
        onRemove();
      }}
      className="mr-5 flex items-center justify-center rounded-2xl bg-rose-500 px-6"
    >
      <Text className="text-sm font-semibold text-white">Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      <View style={{ width: cardWidth }} className="relative overflow-hidden rounded-2xl">
        <PropertyCard
          id={item.property_id}
          title={item.title}
          address={item.address}
          city={item.city}
          state={item.state}
          price={item.price}
          beds={item.beds}
          baths={item.baths}
          sqft={item.sqft}
          imageUrl={item.image_url}
          saved
          onSave={onRemove}
        />
        <TouchableOpacity
          onPress={onRemove}
          className="absolute right-1 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/90"
        >
          <Text className="text-sm font-bold text-white">×</Text>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

export default function SavedScreen() {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedProperty[]>([]);
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
      .from('saved_properties_with_details')
      .select('*')
      .order('created_at', { ascending: false });

    setSaved((data ?? []) as SavedProperty[]);
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

  const handleRemove = useCallback(async (propertyId: string | number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('saved_properties')
      .delete()
      .eq('property_id', propertyId)
      .eq('user_id', user.id);

    setSaved((prev) => prev.filter((p) => p.property_id !== propertyId));
  }, []);

  if (loading && saved.length === 0) {
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
          Saved
        </Text>
        <Text className="mt-2 text-2xl font-bold text-white">
          Saved homes
        </Text>
        <Text className="mt-1 text-sm text-slate-400">
          {saved.length} {saved.length === 1 ? 'property' : 'properties'} saved
        </Text>
      </View>

      {saved.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-5xl">❤️</Text>
          <Text className="mb-2 text-center text-lg font-semibold text-white">
            No saved homes yet
          </Text>
          <Text className="mb-8 text-center text-sm text-slate-400">
            Browse listings and tap the heart to save homes you love.
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
        <FlatList
          data={saved}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View className="h-4" />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#22c55e"
            />
          }
          renderItem={({ item }) => (
            <SwipeableSavedCard
              item={item}
              onRemove={() => handleRemove(item.property_id)}
              cardWidth={width - 48}
            />
          )}
        />
      )}
    </View>
  );
}
