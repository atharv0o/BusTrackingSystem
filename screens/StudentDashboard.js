import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../storage/AppStore';
import GradientShell from '../components/GradientShell';
import StatCard from '../components/StatCard';
import MapScreen from '../components/MapScreen';
import {
  calculateETA,
  findCurrentAndNextStops,
  formatDuration,
  formatKm,
  haversineDistanceKm,
  isJoinCode,
  normalizeText
} from '../utils/helpers';

export default function StudentDashboard() {
  const { state, actions } = useAppStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const trip = state.activeTrip;

  const connected = Boolean(trip && trip.studentTrackingEnabled && trip.status !== 'Completed');

  const { decoratedStops, currentStop, nextStop } = useMemo(
    () => findCurrentAndNextStops(trip?.stops || [], trip?.currentLocation || null),
    [trip?.stops, trip?.currentLocation]
  );

  const etaMinutes = trip?.currentLocation && nextStop
    ? calculateETA(haversineDistanceKm(trip.currentLocation, nextStop), 24)
    : null;

  const distanceToNextStopKm = trip?.currentLocation && nextStop
    ? haversineDistanceKm(trip.currentLocation, nextStop)
    : null;

  const startTracking = async () => {
    setError('');
    const nextCode = normalizeText(code).toUpperCase();

    if (!isJoinCode(nextCode)) {
      setError('Enter the 6-character tracking code.');
      return;
    }

    try {
      await actions.startStudentTracking(nextCode);
    } catch (err) {
      setError(err?.message || 'Unable to track bus.');
    }
  };

  const stopTracking = async () => {
    await actions.stopStudentTracking();
  };

  return (
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Student View</Text>
            <Text style={styles.title}>Track the bus live in real time.</Text>
          </View>
          <TouchableOpacity onPress={() => actions.signOut()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="logout" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {state.lastError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{state.lastError}</Text>
          </View>
        ) : null}
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter Tracking Code</Text>
          <Text style={styles.muted}>Ask the driver for the current 6-character code.</Text>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value.toUpperCase())}
            placeholder="BUS2K9"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            maxLength={6}
            style={styles.input}
          />
          <TouchableOpacity onPress={startTracking} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Track Bus</Text>
          </TouchableOpacity>
          {connected ? (
            <TouchableOpacity onPress={stopTracking} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Stop Tracking</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {trip ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Bus Info</Text>
              <View style={styles.infoRow}>
                <Text style={styles.metaLabel}>Driver</Text>
                <Text style={styles.metaValue}>{trip.driverName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.metaLabel}>Bus Number</Text>
                <Text style={styles.metaValue}>{trip.busNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.metaLabel}>Route</Text>
                <Text style={styles.metaValue}>{trip.routeNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.metaLabel}>Current Stop</Text>
                <Text style={styles.metaValue}>{currentStop?.name || 'Approaching next stop'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.metaLabel}>Next Stop</Text>
                <Text style={styles.metaValue}>{nextStop?.name || 'No more stops'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.metaLabel}>ETA</Text>
                <Text style={styles.metaValue}>{etaMinutes ? `${etaMinutes} min` : 'Calculating...'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.metaLabel}>Distance to Next Stop</Text>
                <Text style={styles.metaValue}>{distanceToNextStopKm != null ? formatKm(distanceToNextStopKm) : 'Calculating...'}</Text>
              </View>
            </View>

            <View style={styles.mapCard}>
              <Text style={styles.cardTitle}>Live Map</Text>
              <Text style={styles.muted}>The marker moves instantly whenever the driver location updates.</Text>
              <MapScreen
                currentLocation={trip.currentLocation}
                stops={decoratedStops}
                locationHistory={trip.locationHistory || []}
              />
            </View>

            <View style={styles.metricsRow}>
              <StatCard label="Distance" value={formatKm(trip.summary?.totalDistanceKm || 0)} hint="Trip path length" />
              <StatCard label="Duration" value={formatDuration(trip.summary?.durationMs || 0)} hint="Since trip start" />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Route Progress</Text>
              <Text style={styles.muted}>Completed stops: {trip.summary?.completedStops || 0}/{trip.summary?.totalStops || decoratedStops.length}</Text>
              <Text style={styles.muted}>Route efficiency: {trip.summary?.routeEfficiency || 0}%</Text>
              <Text style={styles.muted}>Average speed: {Number(trip.summary?.averageSpeed || 0).toFixed(2)} km/h</Text>
              <Text style={styles.muted}>Last updated: {trip.currentLocation?.timestamp ? new Date(trip.currentLocation.timestamp).toLocaleTimeString() : 'Waiting for location'}</Text>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No Trip Connected</Text>
            <Text style={styles.muted}>Enter a valid tracking code to connect to the driver’s live trip.</Text>
          </View>
        )}
      </ScrollView>
    </GradientShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    gap: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800'
  },
  title: {
    marginTop: 6,
    fontSize: 28,
    lineHeight: 34,
    color: '#0F172A',
    fontWeight: '900'
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '700'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8
  },
  muted: {
    color: '#64748B',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    marginTop: 10,
    letterSpacing: 3,
    fontWeight: '800'
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center'
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '900'
  },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6
  },
  metaLabel: {
    color: '#64748B',
    fontWeight: '700'
  },
  metaValue: {
    color: '#0F172A',
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right'
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10
  }
});
