// app/components/MapView.tsx
// Map View для недвижимости

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '@/utils/constants';
// MapView temporarily disabled for Expo Go compatibility
// import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface Listing {
  id: string;
  title: string;
  price: number;
  latitude?: number;
  longitude?: number;
  thumbnail_url?: string;
  video_url?: string;
}

interface MapViewProps {
  listings: Listing[];
  onMarkerPress: (listingId: string) => void;
}

export function RealEstateMap({ listings, onMarkerPress }: MapViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.placeholderMap}>
        <Ionicons name="map" size={64} color="#8E8E93" />
        <Text style={styles.placeholderText}>Карта недоступна</Text>
        <Text style={styles.placeholderSubtext}>
          В экспо версии карты отключены
        </Text>
        <Text style={styles.placeholderInfo}>
          {listings.length} объект(ов)
        </Text>
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Ionicons name="location" size={20} color="#667eea" />
        <Text style={styles.infoText}>
          {listings.filter((l) => l.latitude && l.longitude).length} объектов
          на карте
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerCircle: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFF',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(102, 126, 234, 0.4)',
      },
      default: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
      },
    }),
  },
  markerPrice: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  markerCurrency: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.9,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#667eea',
    marginTop: -2,
  },
  callout: {
    width: 200,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  calloutImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#2C2C2E',
  },
  calloutImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  calloutPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
    marginTop: 4,
    paddingHorizontal: 12,
  },
  calloutButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#667eea',
  },
  calloutButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBox: {
    position: 'absolute',
    top: 120,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  placeholderMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#667eea',
  },
  placeholderSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  placeholderInfo: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});

// Default export for Expo Router (not used as route)
export default function MapViewDefault() {
  return null;
}
