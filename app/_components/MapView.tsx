// app/components/MapView.tsx — КАРТА НЕДВИЖИМОСТИ УРОВНЯ DUBAI + БИШКЕК 2025

import { ultra } from '@/lib/theme/ultra';

import { Ionicons } from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';

import React, { useEffect, useRef } from 'react';

import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Условный импорт react-native-maps (только для native платформ)
let MapViewLib: any = null;
let Callout: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapViewLib = maps.default || maps;
    Callout = maps.Callout;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (e) {
    // react-native-maps не установлен или не доступен
    console.warn('react-native-maps not available:', e);
  }
}

import Animated, { FadeIn } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;

const LATITUDE_DELTA = 0.0922;

const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Фолбэк если react-native-maps не загрузился
const MapViewComponent = MapViewLib || View;

interface Listing {
  id: string;
  title: string;
  price: number;
  latitude?: number;
  longitude?: number;
  thumbnail_url?: string;
}

interface MapViewProps {
  listings: Listing[];
  onMarkerPress: (listingId: string) => void;
}

export default function MapView({ listings, onMarkerPress }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const validListings = listings.filter(l => l.latitude && l.longitude);

  useEffect(() => {
    if (validListings.length > 0 && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          validListings.map(l => ({ latitude: l.latitude!, longitude: l.longitude! })),
          { edgePadding: { top: 100, right: 50, bottom: 100, left: 50 }, animated: true }
        );
      }, 500);
    }
  }, [validListings]);

  // Если карты нет — красивый плейсхолдер
  if (MapViewComponent === View || validListings.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="map-outline" size={80} color={ultra.textMuted} />
        <Text style={styles.placeholderTitle}>Карта недвижимости</Text>
        <Text style={styles.placeholderText}>
          {validListings.length === 0 
            ? 'Нет объектов с координатами' 
            : 'Карта доступна в сборке приложения'}
        </Text>
        <Text style={styles.placeholderCount}>
          {listings.length} объект(ов) в списке
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn} style={styles.container}>
      <MapViewComponent
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        initialRegion={{
          latitude: validListings[0]?.latitude || 42.8746,
          longitude: validListings[0]?.longitude || 74.5698,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
      >
        {validListings.map((listing) => (
          <Marker
            key={listing.id}
            coordinate={{
              latitude: listing.latitude!,
              longitude: listing.longitude!,
            }}
            onPress={() => {
              Haptics.selectionAsync();
              onMarkerPress(listing.id);
            }}
          >
            <View style={styles.marker}>
              <Text style={styles.price}>
                {listing.price.toLocaleString()} с
              </Text>
            </View>
            <Callout tooltip onPress={() => onMarkerPress(listing.id)}>
              <View style={styles.callout}>
                {listing.thumbnail_url ? (
                  <Image source={{ uri: listing.thumbnail_url }} style={styles.calloutImage} />
                ) : (
                  <View style={styles.calloutPlaceholder}>
                    <Ionicons name="home-outline" size={40} color="#666" />
                  </View>
                )}
                <Text style={styles.calloutTitle} numberOfLines={2}>
                  {listing.title}
                </Text>
                <Text style={styles.calloutPrice}>
                  {listing.price.toLocaleString()} сом
                </Text>
                <View style={styles.calloutButton}>
                  <Text style={styles.calloutButtonText}>Подробнее →</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapViewComponent>

      {/* Инфо бокс */}
      <View style={styles.infoBox}>
        <Ionicons name="location" size={20} color={ultra.accent} />
        <Text style={styles.infoText}>
          {validListings.length} объект(ов) на карте
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  placeholder: {
    flex: 1,
    backgroundColor: ultra.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: ultra.textPrimary,
    marginTop: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: ultra.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
  },
  placeholderCount: {
    fontSize: 18,
    color: ultra.accent,
    marginTop: 20,
    fontWeight: '700',
  },
  marker: {
    backgroundColor: ultra.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
      android: { elevation: 6 },
    }),
  },
  price: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  callout: {
    width: 240,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  calloutImage: { width: '100%', height: 140 },
  calloutPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  calloutPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: ultra.accent,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  calloutButton: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: ultra.accent,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoBox: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ultra.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: ultra.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: ultra.textPrimary,
  },
});
