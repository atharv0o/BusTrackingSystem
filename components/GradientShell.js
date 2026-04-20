import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function GradientShell({ children }) {
  return (
    <View style={styles.shell}>
      <View style={styles.glowA} />
      <View style={styles.glowB} />
      <View style={styles.glowC} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    overflow: 'hidden'
  },
  glowA: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.08)',
    top: -80,
    right: -80
  },
  glowB: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(37,99,235,0.10)',
    bottom: 100,
    left: -60
  },
  glowC: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.10)',
    top: 160,
    left: '50%'
  }
});
