import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatCard({ label, value, hint, accent = '#111827' }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 8
  },
  value: {
    fontSize: 22,
    fontWeight: '800'
  },
  hint: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280'
  }
});
