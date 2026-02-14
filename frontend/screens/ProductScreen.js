// frontend/screens/ProductScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { API_URL, wakeUpServer } from '../config/api';
import { useCart } from '../contexts/CartContext';

export default function ProductScreen({ route, navigation }) {
  const { productId } = route.params || {};
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      await wakeUpServer();
      const response = await fetch(`${API_URL}/products/${productId}`);
      const data = await response.json();
      
      if (response.ok) {
        setProduct(data);
      } else {
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProduct();
  };

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    Alert.alert(
      'Added to Cart',
      `${quantity} × ${product.name} added to your cart`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') }
      ]
    );
  };

  const handleBuyNow = () => {
    addToCart({ ...product, quantity });
    navigation.navigate('Checkout');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ec7f13" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <TouchableOpacity
        style={styles.backIcon}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backIconText}>←</Text>
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderEmoji}>🥖</Text>
        </View>
        {!product.isAvailable && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{product.price} Birr</Text>
        </View>

        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {product.rating || 4.5}</Text>
          <Text style={styles.reviewCount}>({product.reviews?.length || 0} reviews)</Text>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {product.description || 'Freshly baked bread made with premium ingredients.'}
        </Text>

        <Text style={styles.sectionTitle}>Product Details</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Size</Text>
            <Text style={styles.detailValue}>{product.size || 'Standard'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{product.category || 'Bread'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Availability</Text>
            <Text style={[styles.detailValue, product.isAvailable ? styles.inStock : styles.outStock]}>
              {product.isAvailable ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={!product.isAvailable}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(quantity + 1)}
            disabled={!product.isAvailable}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.addToCartButton, !product.isAvailable && styles.disabledButton]}
            onPress={handleAddToCart}
            disabled={!product.isAvailable}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buyNowButton, !product.isAvailable && styles.disabledButton]}
            onPress={handleBuyNow}
            disabled={!product.isAvailable}
          >
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f7f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backIcon: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backIconText: {
    fontSize: 24,
    color: '#ec7f13',
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  outOfStockText: {
    color: 'white',
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    marginTop: -20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#221910',
    flex: 1,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ec7f13',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rating: {
    fontSize: 16,
    color: '#f5a623',
    marginRight: 5,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#221910',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  detailItem: {
    width: '33.33%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  inStock: {
    color: '#4CAF50',
  },
  outStock: {
    color: '#f44336',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ec7f13',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ec7f13',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  addToCartText: {
    color: '#ec7f13',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#ec7f13',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  buyNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  backButton: {
    backgroundColor: '#ec7f13',
    padding: 15,
    borderRadius: 10,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
