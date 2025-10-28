// app/components/MapView.tsx
// Map View для недвижимости

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Bishkek coordinates
const BISHKEK_REGION = {
  latitude: 42.8746,
  longitude: 74.5698,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export function RealEstateMap({ listings, onMarkerPress }: MapViewProps) {
  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={BISHKEK_REGION}
        showsUserLocation={true}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {listings
          .filter((listing) => listing.latitude && listing.longitude)
          .map((listing) => (
            <Marker
              key={listing.id}
              coordinate={{
                latitude: listing.latitude!,
                longitude: listing.longitude!,
              }}
              onPress={() => onMarkerPress(listing.id)}
            >
              {/* Custom Marker */}
              <View style={styles.markerContainer}>
                <View style={styles.markerCircle}>
                  <Text style={styles.markerPrice}>
                    {formatPrice(listing.price)}
                  </Text>
                  <Text style={styles.markerCurrency}>сом</Text>
                </View>
                <View style={styles.markerArrow} />
              </View>

              {/* Callout (preview when tapped) */}
              <Callout onPress={() => onMarkerPress(listing.id)}>
                <View style={styles.callout}>
                  {listing.thumbnail_url ? (
                    <Image
                      source={{ uri: listing.thumbnail_url }}
                      style={styles.calloutImage}
                    />
                  ) : (
                    <View style={styles.calloutImagePlaceholder}>
                      <Ionicons name="home" size={24} color="#8E8E93" />
                    </View>
                  )}
                  <Text style={styles.calloutTitle} numberOfLines={2}>
                    {listing.title}
                  </Text>
                  <Text style={styles.calloutPrice}>
                    {listing.price.toLocaleString('ru-RU')} сом
                  </Text>
                  <View style={styles.calloutButton}>
                    <Text style={styles.calloutButtonText}>Подробнее →</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
      </MapView>

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
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});

