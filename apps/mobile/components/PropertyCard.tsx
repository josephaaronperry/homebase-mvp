import { Link } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';

type PropertyCardProps = {
  id: string | number;
  title?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  imageUrl?: string | null;
  onSave?: () => void;
  saved?: boolean;
};

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80';

export function PropertyCard({
  id,
  title,
  address,
  city,
  state,
  price,
  beds,
  baths,
  sqft,
  imageUrl,
  onSave,
  saved = false,
}: PropertyCardProps) {
  const displayPrice = price
    ? `$${Number(price).toLocaleString()}`
    : 'Price on request';
  const badge = `${beds ?? '-'} bd • ${baths ?? '-'} ba • ${
    sqft ? `${sqft.toLocaleString()} sqft` : '-'
  }`;

  return (
    <Link href={`/properties/${id}`} asChild>
      <TouchableOpacity
        activeOpacity={0.9}
        className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80"
      >
        <View className="relative h-40 w-full bg-slate-800">
          <Image
            source={{ uri: imageUrl || PLACEHOLDER_IMG }}
            className="h-full w-full"
            resizeMode="cover"
          />
          <View className="absolute right-3 top-3">
            <TouchableOpacity
              onPress={() => onSave?.()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50"
            >
              <Text className="text-base">{saved ? '♥' : '♡'}</Text>
            </TouchableOpacity>
          </View>
          <View className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5">
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-950">
              Active
            </Text>
          </View>
        </View>
        <View className="px-3 py-2.5">
          <Text className="text-base font-semibold text-white">
            {displayPrice}
          </Text>
          <Text className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {badge}
          </Text>
          <Text className="mt-1 text-xs text-slate-200" numberOfLines={1}>
            {address || title || 'Untitled property'}
          </Text>
          {(city || state) && (
            <Text className="mt-0.5 text-[11px] text-slate-500">
              {city}
              {city && state ? ', ' : ''}
              {state}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );
}
