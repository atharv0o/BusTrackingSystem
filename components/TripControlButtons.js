import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

function ButtonBase({ title, onPress, color, disabled }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor: disabled ? '#CBD5E1' : color }]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function TripControlButtons({ onStart, onPause, onEnd, startDisabled, pauseDisabled, endDisabled }) {
  return (
    <View style={styles.row}>
      <ButtonBase title="START" onPress={onStart} color="#16A34A" disabled={startDisabled} />
      <ButtonBase title="PAUSE" onPress={onPause} color="#F59E0B" disabled={pauseDisabled} />
      <ButtonBase title="END" onPress={onEnd} color="#DC2626" disabled={endDisabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10
  },
  button: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.7
  }
});
