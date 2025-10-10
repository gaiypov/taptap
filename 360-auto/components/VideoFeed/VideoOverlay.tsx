import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Car } from '../../types';

interface VideoOverlayProps {
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  likes?: number;
  comments?: number;
  saves?: number;
  car?: Car;
}

export function VideoOverlay({ 
  onLike, 
  onComment, 
  onShare,
  onSave,
  likes = 0, 
  comments = 0,
  saves = 0,
  car
}: VideoOverlayProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' сом';
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('ru-RU').format(mileage) + ' км';
  };

  return (
    <View style={styles.overlay}>
      {/* Right side actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Ionicons name="heart" size={24} color={Colors.text} />
          <Text style={styles.actionText}>{likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble" size={24} color={Colors.text} />
          <Text style={styles.actionText}>{comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onSave}>
          <Ionicons name="bookmark" size={24} color={Colors.text} />
          <Text style={styles.actionText}>{saves}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>
            {car?.sellerName || 'Продавец'}
            {car?.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={styles.verifiedIcon} />
            )}
          </Text>
          <Text style={styles.carTitle}>
            {car ? `${car.brand} ${car.model} ${car.year}` : 'BMW M3 Competition'}
          </Text>
        </View>
        
        <Text style={styles.carPrice}>
          {car ? formatPrice(car.price) : '2 500 000 сом'}
        </Text>
        
        <Text style={styles.location}>
          📍 {car?.location || 'Бишкек'}
        </Text>
        
        <Text style={styles.mileage}>
          🚗 {car ? formatMileage(car.mileage) : '45 000 км'}
        </Text>
        
        {car?.aiAnalysis && (
          <View style={styles.aiAnalysis}>
            <View style={styles.conditionRow}>
              <Text style={styles.conditionLabel}>Состояние:</Text>
              <Text style={[
                styles.conditionText,
                { color: car.aiAnalysis.condition === 'excellent' ? Colors.success : 
                         car.aiAnalysis.condition === 'good' ? Colors.warning : Colors.error }
              ]}>
                {car.aiAnalysis.condition === 'excellent' ? 'Отличное' :
                 car.aiAnalysis.condition === 'good' ? 'Хорошее' :
                 car.aiAnalysis.condition === 'fair' ? 'Удовлетворительное' : 'Плохое'}
              </Text>
              <Text style={styles.conditionScore}>
                ({car.aiAnalysis.conditionScore}/100)
              </Text>
            </View>
            
            {car.aiAnalysis.damages.length > 0 && (
              <View style={styles.damagesInfo}>
                <Text style={styles.damagesLabel}>Повреждения:</Text>
                {car.aiAnalysis.damages.map((damage, index) => (
                  <Text key={index} style={styles.damageText}>
                    • {damage.location}: {damage.type} ({damage.severity})
                  </Text>
                ))}
              </View>
            )}
            
            {car.aiAnalysis.features.length > 0 && (
              <View style={styles.featuresInfo}>
                <Text style={styles.featuresLabel}>Особенности:</Text>
                <Text style={styles.featuresText}>
                  {car.aiAnalysis.features.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  rightActions: {
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: Colors.text,
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
  bottomInfo: {
    backgroundColor: Colors.overlayDark,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  sellerInfo: {
    marginBottom: 8,
  },
  sellerName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  carTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  carPrice: {
    color: Colors.success,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  location: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  mileage: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  aiAnalysis: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginRight: 8,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  conditionScore: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  damagesInfo: {
    marginBottom: 8,
  },
  damagesLabel: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  damageText: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginLeft: 8,
  },
  featuresInfo: {
    marginBottom: 4,
  },
  featuresLabel: {
    color: Colors.info,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuresText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
});