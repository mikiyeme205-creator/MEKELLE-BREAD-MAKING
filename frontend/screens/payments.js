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
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../services/api';

const PAYMENT_METHODS = [
  {
    id: 'cash',
    name: 'Cash on Delivery',
    icon: 'money',
    description: 'Pay when bread arrives',
    color: '#4CAF50'
  },
  {
    id: 'cbe',
    name: 'Commercial Bank of Ethiopia',
    icon: 'account-balance',
    description: 'Account: 1000668411901',
    color: '#2196F3'
  },
  {
    id: 'telebirr',
    name: 'Telebirr',
    icon: 'smartphone',
    description: '0969377085',
    color: '#FF9800'
  },
  {
    id: 'mpesa',
    name: 'M-Pesa Safari',
    icon: 'phone-android',
    description: '0706377085',
    color: '#9C27B0'
  },
  {
    id: 'abisnya',
    name: 'Abisnya',
    icon: 'payment',
    description: 'Coming Soon',
    color: '#795548',
    disabled: true
  },
  {
    id: 'enat',
    name: 'Enat Bank',
    icon: 'account-balance',
    description: 'Coming Soon',
    color: '#E91E63',
    disabled: true
  },
  {
    id: 'dashen',
    name: 'Dashen Bank',
    icon: 'account-balance',
    description: 'Coming Soon',
    color: '#607D8B',
    disabled: true
  },
  {
    id: 'other',
    name: 'Other Methods',
    icon: 'more-horiz',
    description: 'Contact for details',
    color: '#9E9E9E'
  }
];

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, totalAmount } = route.params;
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/payments/process', {
        orderId,
        paymentMethod: selectedMethod,
        transactionId: selectedMethod !== 'cash' ? transactionId : undefined
      });

      if (response.data.success) {
        Alert.alert(
          'Payment Successful',
          `Your payment has been processed. ${selectedMethod !== 'cash' ? response.data.paymentInstructions : ''}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('OrderTracking', { orderId })
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Payment Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethod = (method) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.methodCard,
        selectedMethod === method.id && styles.selectedCard,
        method.disabled && styles.disabledCard
      ]}
      onPress={() => !method.disabled && setSelectedMethod(method.id)}
      disabled={method.disabled}
    >
      <View style={[styles.iconContainer, { backgroundColor: method.color }]}>
        <MaterialIcons name={method.icon} size={24} color="white" />
      </View>
      <View style={styles.methodInfo}>
        <Text style={styles.methodName}>{method.name}</Text>
        <Text style={styles.methodDescription}>{method.description}</Text>
      </View>
      {selectedMethod === method.id && (
        <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
      )}
      {method.disabled && (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Payment Method</Text>
          <Text style={styles.subtitle}>Total Amount: {totalAmount} Birr</Text>
          <Text style={styles.orderId}>Order ID: {orderId}</Text>
        </View>

        <View style={styles.methodsList}>
          {PAYMENT_METHODS.map(renderPaymentMethod)}
        </View>

        {selectedMethod && selectedMethod !== 'cash' && (
          <View style={styles.transactionInput}>
            <Text style={styles.inputLabel}>Transaction ID / Reference</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter transaction reference"
              value={transactionId}
              onChangeText={setTransactionId}
            />
            <Text style={styles.helperText}>
              Please enter the transaction ID from your payment
            </Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            For bank transfers, use the account numbers shown above. Include your order ID in the reference.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedMethod || loading) && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={!selectedMethod || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.payButtonText}>
                {selectedMethod === 'cash' ? 'Place Order' : 'Confirm Payment'}
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
  header: {
    marginBottom: 24,
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4
  },
  orderId: {
    fontSize: 14,
    color: '#999'
  },
  methodsList: {
    marginBottom: 16
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  selectedCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#F1F8E9'
  },
  disabledCard: {
    opacity: 0.5
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  methodInfo: {
    flex: 1
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  methodDescription: {
    fontSize: 14,
    color: '#666'
  },
  comingSoon: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  comingSoonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500'
  },
  transactionInput: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8
  },
  helperText: {
    fontSize: 12,
    color: '#666'
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start'
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1976D2'
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white'
  },
  payButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12
  },
  payButtonDisabled: {
    backgroundColor: '#A5D6A7'
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8
  }
});
