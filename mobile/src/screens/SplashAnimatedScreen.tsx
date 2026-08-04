import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SplashAnimatedScreen() {
  const scaleValue = useRef(new Animated.Value(0.5)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<any>();

  useEffect(() => {

    // Run animation
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Navigate to Main app after a short delay
      setTimeout(() => {
        navigation.replace('MainTabs');
      }, 500);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image 
        source={require('../../assets/logo.png')} 
        style={[
          styles.logo,
          {
            opacity: opacityValue,
            transform: [{ scale: scaleValue }]
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  }
});
