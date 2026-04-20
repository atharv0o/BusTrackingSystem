import React from 'react';
import { View, Text } from 'react-native';

export default function DriverPanel() {
  return (
    <View style={{ marginTop: 20, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, backgroundColor: '#fff' }}>
      <Text style={{ fontWeight: '700', color: '#111827' }}>Driver Panel</Text>
      <Text style={{ marginTop: 6, color: '#6b7280' }}>GPS is pushed to Firebase Realtime Database as live coordinates.</Text>
    </View>
  );
}
