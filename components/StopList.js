import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function StopList({ stops = [], onToggleComplete }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Route Stops</Text>
      {stops.length ? (
        stops.map((stop) => (
          <TouchableOpacity
            key={stop.id}
            style={[
              styles.stopRow,
              stop.completed && styles.completed,
              stop.isCurrent && styles.current
            ]}
            onPress={() => onToggleComplete?.(stop.id)}
            activeOpacity={0.82}
          >
            <View style={styles.stopText}>
              <Text style={[styles.stopName, stop.completed && styles.completedText]}>
                {stop.order ? `${stop.order}. ` : ''}
                {stop.name}
              </Text>
              <Text style={styles.meta}>
                {stop.scheduledTime ? `${stop.scheduledTime}  ` : ''}
                {stop.distanceKm != null ? `${stop.distanceKm.toFixed(2)} km away` : 'Distance pending'}
              </Text>
            </View>
            <Text
              style={[
                styles.badge,
                stop.completed ? styles.badgeComplete : stop.isCurrent ? styles.badgeCurrent : styles.badgeUpcoming
              ]}
            >
              {stop.completed ? 'Done' : stop.isCurrent ? 'Now' : 'Next'}
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.empty}>No stops added yet.</Text>
      )}
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
  heading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 12
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 10
  },
  completed: {
    backgroundColor: '#ECFDF5'
  },
  current: {
    backgroundColor: '#FEF3C7'
  },
  stopText: {
    flex: 1,
    paddingRight: 12
  },
  stopName: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 15
  },
  completedText: {
    color: '#047857'
  },
  meta: {
    color: '#6B7280',
    marginTop: 4,
    fontSize: 12
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF'
  },
  badgeComplete: {
    backgroundColor: '#16A34A'
  },
  badgeCurrent: {
    backgroundColor: '#F59E0B'
  },
  badgeUpcoming: {
    backgroundColor: '#7C3AED'
  },
  empty: {
    color: '#6B7280'
  }
});
