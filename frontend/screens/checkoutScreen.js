import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const { cartItems, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    instructions: ''
  });

  const calculateDeliveryFee = () => {
    return total > 100 ? 0 : 20;
  };

  const grandTotal = total + calculateDeliveryFee();

  const handleCheckout = async () => {
    // Validate address
    if (!address.street || !address.city) {
      Alert.alert('Error', 'Please enter your delivery address');
      return;
    }

    setLoading(true);
    try {
      const orderItems = cartItems.map(item => ({
        productId: item._id,
        quantity: item.quantity
      }));

      const response = await api.post('/orders', {
        items: orderItems,
        deliveryAddress: address,
        paymentMethod: 'cash', // Default, user will select in next screen
        notes: address.instructions
      });

      if (response.data.success) {
        clearCart();
        navigation.navigate('Payment', {
          orderId: response.data.order.orderId,
          totalAmount: grandTotal
        });
      }
    } catch (error) {
      Alert.alert('Checkout Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <MaterialIcons name="location-on" size={24} color="#4CAF50" />
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>Home</Text>
              <Text style={styles.addressText}>
                {address.street || 'Enter street address'}
              </Text>
              <Text style={styles.addressText}>
                {address.city} {address.zipCode}
              </Text>
              <TouchableOpacity
                style={styles.changeAddressButton}
                onPress={() => navigation.navigate('Address')}
              >
                <Text style={styles.changeAddressText}>Change Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            {cartItems.map((item, index) => (
              <View key={index} style={styles.summaryItem}>
                <Text style={styles.itemName}>
                  {item.name} ({item.size})
                </Text>
                <Text style={styles.itemPrice}>
                  {item.quantity} × {item.price} Birr
                </Text>
              </View>
            ))}
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.rowLabel}>Subtotal</Text>
              <Text style={styles.rowValue}>{total} Birr</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.rowLabel}>Delivery Fee</Text>
              <Text style={styles.rowValue}>
                {calculateDeliveryFee() === 0 ? 'FREE' : `${calculateDeliveryFee()} Birr`}
              </Text>
            </View>
            
            {total > 100 && (
              <View style={styles.freeDelivery}>
                <MaterialIcons name="local-offer" size={16} color="#4CAF50" />
                <Text style={styles.freeDeliveryText}>Free delivery on orders over 100 Birr!</Text>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{grandTotal} Birr</Text>
            </View>
          </View>
        </View>

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Instructions</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="Add instructions for delivery (optional)"
            multiline
            numberOfLines={3}
            value={address.instructions}
            onChangeText={(text) => setAddress({...address, instructions: text})}
          />
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={loading || cartItems.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.checkoutButtonText}>
                Proceed to Payment
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333'
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start'
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  changeAddressButton: {
    marginTop: 8
  },
  changeAddressText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500'
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  itemName: {
    fontSize: 14,
    color: '#333'
  },
  itemPrice: {
    fontSize: 14,
    color: '#666'
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  rowLabel: {
    fontSize: 14,
    color: '#666'
  },
  rowValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  freeDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 12
  },
  freeDeliveryText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500'
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  instructionsInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white'
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12
  },
  checkoutButtonDisabled: {
    backgroundColor: '#A5D6A7'
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8
  }
});
