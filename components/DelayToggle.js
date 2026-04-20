import React from 'react';
import { View, Text, Switch, TextInput, StyleSheet } from 'react-native';

export default function DelayToggle({ value, reason, onChange, onChangeReason }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.title}>Delay Status</Text>
          <Text style={styles.subtitle}>Mark the trip delayed and add a reason.</Text>
        </View>
        <Switch value={value} onValueChange={onChange} />
      </View>
      {value ? (
        <TextInput
          value={reason}
          onChangeText={onChangeReason}
          placeholder="Delay reason"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827'
  },
  subtitle: {
    marginTop: 4,
    color: '#6B7280'
  },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    backgroundColor: '#F9FAFB'
  }
});
