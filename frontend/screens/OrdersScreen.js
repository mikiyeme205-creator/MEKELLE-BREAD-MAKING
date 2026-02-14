// frontend/screens/OrdersScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, wakeUpServer } from '../config/api';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      await wakeUpServer();
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_URL}/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to load orders');
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
    fetchOrders();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      confirmed: '#2196f3',
      preparing: '#9c27b0',
      ready: '#4caf50',
      out_for_delivery: '#ff5722',
      delivered: '#4caf50',
      cancelled: '#f44336',
    };
    return colors[status] || '#999';
  };

  const getStatusText = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderTracking', { orderId: item.orderId })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.orderId}</Text>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) }]}>
          <Text style={styles.statusText}>{getStatusText(item.orderStatus)}</Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {item.items?.slice(0, 2).map((orderItem, index) => (
          <Text key={index} style={styles.itemText}>
            {orderItem.quantity}× {orderItem.product?.name || 'Bread'}
          </Text>
        ))}
        {item.items?.length > 2 && (
          <Text style={styles.moreText}>+{item.items.length - 2} more items</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalAmount}>{item.totalAmount} Birr</Text>
      </View>

      <View style={styles.paymentInfo}>
        <Text style={styles.paymentMethod}>
          Payment: {item.paymentMethod?.toUpperCase() || 'CASH'}
        </Text>
        <Text style={[
          styles.paymentStatus,
          { color: item.paymentStatus === 'paid' ? '#4caf50' : '#ff9800' }
        ]}>
          {item.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ec7f13" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyText}>
            Looks like you haven't placed any orders yet. Start ordering some delicious bread!
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 50,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#221910',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  shopButton: {
    backgroundColor: '#ec7f13',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#221910',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemsContainer: {
    marginBottom: 10,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ec7f13',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
});
