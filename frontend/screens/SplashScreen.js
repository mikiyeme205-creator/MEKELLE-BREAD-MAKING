import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#ec7f13'
    }}>
      <View style={{
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <Text style={{ fontSize: 40 }}>🥖</Text>
      </View>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: 'white',
        marginBottom: 10
      }}>
        Digital Bread
      </Text>
      <Text style={{ 
        fontSize: 16, 
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 30
      }}>
        Mekelle's Finest Bakery
      </Text>
      <ActivityIndicator size="large" color="white" />
    </View>
  );
}
