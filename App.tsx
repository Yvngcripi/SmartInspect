import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 500;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={[styles.root, !isDesktop && styles.rootMobile]}>
        <View style={[styles.mobileFrame, isDesktop && styles.mobileFrameDesktop]}>
          <AppNavigator />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rootMobile: {
    backgroundColor: '#064e3b',
    alignItems: 'stretch',
    justifyContent: 'flex-start'
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff'
  },
  mobileFrameDesktop: {
    maxWidth: 480,
    overflow: 'hidden'
  }
});
