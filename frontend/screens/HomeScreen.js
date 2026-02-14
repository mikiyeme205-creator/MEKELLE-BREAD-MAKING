// frontend/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wakingUp, setWakingUp] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setWakingUp(true);
      // First request might be slow (server waking up)
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load products. Pull down to refresh.');
    } finally {
      setLoading(false);
      setWakingUp(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ec7f13" />
        {wakingUp && (
          <Text style={{ marginTop: 20, textAlign: 'center', color: '#666' }}>
            Waking up the server...{'\n'}
            This may take up to 50 seconds on first use.
          </Text>
        )}
      </View>
    );
  }

  return (
    <View>
      {/* Your product list here */}
    </View>
  );
}
