// frontend/screens/OrderTrackingScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, wakeUpServer } from '../config/api';

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      await wakeUpServer();
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      // Fetch order details
      const orderResponse = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const orderData = await orderResponse.json();

      // Fetch tracking info
      const trackingResponse = await fetch(`${API_URL}/orders/${orderId}/track`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const trackingData = await trackingResponse.json();

      if (orderResponse.ok && trackingResponse.ok) {
        setOrder(orderData.order);
        setTracking(trackingData.tracking);
      } else {
        Alert.alert('Error', 'Failed to load order details');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const getStatusStep = (status) => {
    const steps = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      ready: 3,
      out_for_delivery: 4,
      delivered: 5,
      cancelled: -1,
    };
    return steps[status] || 0;
  };

  const getStatusIcon = (step, currentStep) => {
    if (step < currentStep) return '✅';
    if (step === currentStep) return '⏳';
    return '○';
  };

  const getStatusColor = (step, currentStep) => {
    if (step < currentStep) return '#4caf50';
    if (step === currentStep) return '#ec7f13';
    return '#ddd';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not yet';
    const date = new Date(dateString);
    return date.toLocaleString('en-ET', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ec7f13" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = getStatusStep(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.orderInfoCard}>
        <Text style={styles.orderId}>Order #{order.orderId}</Text>
        <Text style={styles.orderDate}>
          Placed on {formatDateTime(order.createdAt)}
        </Text>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: isCancelled ? '#f44336' : '#4caf50' }]}>
            <Text style={styles.statusText}>
              {isCancelled ? 'Cancelled' : order.orderStatus.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
      </View>

      {!isCancelled && (
        <View style={styles.trackingContainer}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.stepContainer}>
              <View style={[styles.stepIcon, { backgroundColor: getStatusColor(0, currentStep) }]}>
                <Text style={styles.stepIconText}>{getStatusIcon(0, currentStep)}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Order Placed</Text>
                <Text style={styles.stepTime}>
                  {formatDateTime(order.createdAt)}
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={[styles.stepIcon, { backgroundColor: getStatusColor(1, currentStep) }]}>
                <Text style={styles.stepIconText}>{getStatusIcon(1, currentStep)}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Confirmed</Text>
                <Text style={styles.stepTime}>
                  {currentStep >= 1 ? formatDateTime(order.updatedAt) : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={[styles.stepIcon, { backgroundColor: getStatusColor(2, currentStep) }]}>
                <Text style={styles.stepIconText}>{getStatusIcon(2, currentStep)}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Preparing</Text>
                <Text style={styles.stepTime}>
                  {currentStep >= 2 ? formatDateTime(order.updatedAt) : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={[styles.stepIcon, { backgroundColor: getStatusColor(3, currentStep) }]}>
                <Text style={styles.stepIconText}>{getStatusIcon(3, currentStep)}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Ready</Text>
                <Text style={styles.stepTime}>
                  {currentStep >= 3 ? formatDateTime(order.updatedAt) : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={[styles.stepIcon, { backgroundColor: getStatusColor(4, currentStep) }]}>
                <Text style={styles.stepIconText}>{getStatusIcon(4, currentStep)}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Out for Delivery</Text>
                <Text style={styles.stepTime}>
                  {currentStep >= 4 ? formatDateTime(order.updatedAt) : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={[styles.stepIcon, { backgroundColor: getStatusColor(5, currentStep) }]}>
                <Text style={styles.stepIconText}>{getStatusIcon(5, currentStep)}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Delivered</Text>
                <Text style={styles.stepTime}>
                  {order.deliveredAt ? formatDateTime(order.deliveredAt) : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        
        {order.items?.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.quantity}× {item.product?.name || 'Bread'}
            </Text>
            <Text style={styles.itemPrice}>{item.price * item.quantity} Birr</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{order.subtotal} Birr</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery Fee</Text>
          <Text style={styles.totalValue}>{order.deliveryFee} Birr</Text>
        </View>

        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>{order.totalAmount} Birr</Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <Text style={styles.sectionTitle}>Payment Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Method:</Text>
          <Text style={styles.infoValue}>{order.paymentMethod?.toUpperCase()}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, { color: order.paymentStatus === 'paid' ? '#4caf50' : '#ff9800' }]}>
            {order.paymentStatus?.toUpperCase()}
          </Text>
        </View>

        {order.paymentDetails?.transactionId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction ID:</Text>
            <Text style={styles.infoValue}>{order.paymentDetails.transactionId}</Text>
          </View>
        )}
      </View>

      <View style={styles.deliveryDetails}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        
        <View style={styles.addressCard}>
          <Text style={styles.addressText}>{order.deliveryAddress?.street}</Text>
          <Text style={styles.addressText}>
            {order.deliveryAddress?.city}, {order.deliveryAddress?.state}
          </Text>
          <Text style={styles.addressText}>{order.deliveryAddress?.zipCode}</Text>
          {order.deliveryAddress?.instructions && (
            <>
              <Text style={styles.instructionsLabel}>Instructions:</Text>
              <Text style={styles.instructionsText}>{order.deliveryAddress.instructions}</Text>
            </>
          )}
        </View>
      </View>

      {tracking?.assignedTo && (
        <View style={styles.deliveryPersonCard}>
          <Text style={styles.sectionTitle}>Delivery Person</Text>
          <View style={styles.personInfo}>
            <View style={styles.personAvatar}>
              <Text style={styles.personAvatarText}>👤</Text>
            </View>
            <View style={styles.personDetails}>
              <Text style={styles.personName}>{tracking.assignedTo.fullName}</Text>
              <Text style={styles.personPhone}>{tracking.assignedTo.phone}</Text>
            </View>
          </View>
        </View>
      )}

      {order.orderStatus === 'delivered' && (
        <TouchableOpacity style={styles.reorderButton}>
          <Text style={styles.reorderButtonText}>Reorder</Text>
        </TouchableOpacity>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'white',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: '#ec7f13',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#221910',
  },
  placeholder: {
    width: 40,
  },
  orderInfoCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#221910',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  trackingContainer: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#221910',
    marginBottom: 15,
  },
  progressContainer: {
    marginTop: 10,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIconText: {
    fontSize: 18,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#221910',
    marginBottom: 4,
  },
  stepTime: {
    fontSize: 12,
    color: '#666',
  },
  detailsContainer: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ec7f13',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#221910',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ec7f13',
  },
  paymentDetails: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  deliveryDetails: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#221910',
    marginTop: 10,
    marginBottom: 5,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  deliveryPersonCard: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ec7f13',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  personAvatarText: {
    fontSize: 24,
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#221910',
    marginBottom: 5,
  },
  personPhone: {
    fontSize: 14,
    color: '#666',
  },
  reorderButton: {
    backgroundColor: '#ec7f13',
    margin: 15,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  reorderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
