import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import GradientShell from '../components/GradientShell';

export default function LoadingScreen() {
  return (
    <GradientShell>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.text}>Preparing your local bus tracker...</Text>
      </View>
    </GradientShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    marginTop: 12,
    color: '#475569',
    fontWeight: '700'
  }
});
