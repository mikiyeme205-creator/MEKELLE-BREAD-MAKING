import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { View, Text, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProductScreen from './screens/ProductScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import PaymentScreen from './screens/PaymentScreen';
import OrderTrackingScreen from './screens/OrderTrackingScreen';
import ProfileScreen from './screens/ProfileScreen';
import OrdersScreen from './screens/OrdersScreen';
import SplashScreen from './screens/SplashScreen';

const Stack = createStackNavigator();

// API Configuration
export const API_BASE_URL = 'https://mekelle-bread-making.onrender.com';
export const API_URL = `${API_BASE_URL}/api`;

// Function to wake up the server (handles Render.com free tier spin-down)
export const wakeUpServer = async () => {
  try {
    console.log('🌐 Waking up server...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Server is awake!');
      return true;
    }
    return false;
  } catch (error) {
    console.log('⚠️ Server waking (this is normal for first request):', error.message);
    return false;
  }
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [hasConnection, setHasConnection] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  // Check network and wake server on app start
  useEffect(() => {
    const initializeApp = async () => {
      // Check network connection
      const netState = await NetInfo.fetch();
      setHasConnection(netState.isConnected);
      
      if (netState.isConnected) {
        // Try to wake up the server
        setIsServerWaking(true);
        await wakeUpServer();
        setIsServerWaking(false);
        
        // Check if user is already logged in
        try {
          const userToken = await AsyncStorage.getItem('userToken');
          if (userToken) {
            setInitialRoute('Home');
          }
        } catch (error) {
          console.log('Error checking login status:', error);
        }
      }
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setHasConnection(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Loading screen
  if (isLoading) {
    return <SplashScreen />;
  }

  // No internet connection screen
  if (!hasConnection) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, marginBottom: 20 }}>📶</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>No Internet Connection</Text>
        <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
          Please check your internet connection and try again.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#ec7f13', padding: 15, borderRadius: 10 }}
          onPress={() => {
            setIsLoading(true);
            NetInfo.fetch().then(state => {
              setHasConnection(state.isConnected);
              setIsLoading(false);
            });
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          {/* Server waking modal */}
          <Modal
            visible={isServerWaking}
            transparent={true}
            animationType="fade"
          >
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)'
            }}>
              <View style={{
                backgroundColor: 'white',
                padding: 30,
                borderRadius: 15,
                alignItems: 'center',
                maxWidth: 300
              }}>
                <ActivityIndicator size="large" color="#ec7f13" />
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginTop: 20,
                  marginBottom: 10
                }}>
                  Waking up the server...
                </Text>
                <Text style={{
                  textAlign: 'center',
                  color: '#666',
                  fontSize: 14
                }}>
                  This may take up to 30 seconds on first use of the day.
                </Text>
              </View>
            </View>
          </Modal>

          <Stack.Navigator 
            initialRouteName={initialRoute} 
            screenOptions={{ 
              headerShown: false,
              cardStyle: { backgroundColor: '#f8f7f6' }
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Product" component={ProductScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}
