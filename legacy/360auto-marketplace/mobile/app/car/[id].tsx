import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function CarDetailsScreen() {
  const { id } = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Car Details</Text>
      <Text style={styles.carId}>Car ID: {id}</Text>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.detailText}>360° Video will be displayed here</Text>
        <Text style={styles.detailText}>Car specifications</Text>
        <Text style={styles.detailText}>Owner information</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  carId: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 15,
    textAlign: 'center',
  },
});
