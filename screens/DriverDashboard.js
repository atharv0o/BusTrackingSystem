import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../storage/AppStore';
import GradientShell from '../components/GradientShell';
import StatCard from '../components/StatCard';
import TripControlButtons from '../components/TripControlButtons';
import DelayToggle from '../components/DelayToggle';
import StopList from '../components/StopList';
import MapScreen from '../components/MapScreen';
import { calculateETA, findCurrentAndNextStops, formatDuration, formatKm, normalizeText } from '../utils/helpers';

const defaultForm = {
  driverName: '',
  busNumber: '',
  routeNumber: '',
  shiftTiming: '',
  routeName: ''
};

export default function DriverDashboard() {
  const { state, actions } = useAppStore();
  const session = state.session;
  const trip = state.activeTrip;
  const [form, setForm] = useState(defaultForm);
  const [stopDraft, setStopDraft] = useState({
    name: '',
    latitude: '',
    longitude: '',
    scheduledTime: '',
    order: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.fullName && !form.driverName) {
      setForm((prev) => ({ ...prev, driverName: session.fullName }));
    }
  }, [session?.fullName, form.driverName]);

  const { decoratedStops, currentStop, nextStop } = useMemo(
    () => findCurrentAndNextStops(trip?.stops || [], trip?.currentLocation || null),
    [trip?.stops, trip?.currentLocation]
  );

  const liveDurationMs = useMemo(() => {
    if (!trip?.startedAt) return 0;

    const elapsed = (trip.endedAt || Date.now()) - trip.startedAt;
    const pausedNow = trip.pausedAt ? Math.max(0, Date.now() - trip.pausedAt) : 0;
    const pausedTotal = Number(trip.pausedDurationMs || 0) + pausedNow;

    return Math.max(0, elapsed - pausedTotal);
  }, [trip?.startedAt, trip?.endedAt, trip?.pausedAt, trip?.pausedDurationMs]);

  const metrics = useMemo(() => {
    if (!trip) return null;
    return trip.summary || {
      totalDistanceKm: 0,
      durationMs: liveDurationMs,
      averageSpeed: 0,
      completedStops: trip.stops?.filter((stop) => stop.completed).length || 0,
      totalStops: trip.stops?.length || 0,
      routeEfficiency: 0
    };
  }, [trip, liveDurationMs]);

  const submitTrip = async () => {
    setError('');
    try {
      await actions.createTrip({
        driverName: form.driverName,
        busNumber: form.busNumber,
        routeNumber: form.routeNumber,
        shiftTiming: form.shiftTiming,
        routeName: form.routeName
      });
    } catch (err) {
      setError(err?.message || 'Unable to create trip.');
    }
  };

  const handleAddStop = async () => {
    setError('');
    try {
      let latitude = Number(stopDraft.latitude);
      let longitude = Number(stopDraft.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        if (trip?.currentLocation) {
          latitude = Number(trip.currentLocation.latitude);
          longitude = Number(trip.currentLocation.longitude);
        } else {
          throw new Error('Provide coordinates or start the trip to use live GPS.');
        }
      }

      await actions.addStop({
        name: stopDraft.name,
        latitude,
        longitude,
        scheduledTime: stopDraft.scheduledTime,
        order: stopDraft.order
      });

      setStopDraft({ name: '', latitude: '', longitude: '', scheduledTime: '', order: '' });
    } catch (err) {
      setError(err?.message || 'Unable to add stop.');
    }
  };

  const endSession = async () => {
    setError('');
    try {
      await actions.endTrip();
    } catch (err) {
      setError(err?.message || 'Unable to end trip.');
    }
  };

  const logout = async () => {
    await actions.signOut();
  };

  const canStart = Boolean(trip && (trip.status === 'Idle' || trip.status === 'Paused'));
  const canPause = Boolean(trip && trip.status === 'In Progress');
  const canEnd = Boolean(trip && trip.status !== 'Completed');
  const startLabel = trip?.status === 'Paused' ? 'RESUME TRIP' : 'START TRIP';
  const gpsStatus = trip?.currentLocation ? 'Connected' : 'Disconnected';

  return (
    <GradientShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Driver Console</Text>
            <Text style={styles.title}>Manage the trip from one clean dashboard.</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.iconBtn}>
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

        {(!trip || trip.status === 'Completed') ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{trip?.status === 'Completed' ? 'Create New Trip' : 'Create Trip'}</Text>
            <Text style={styles.muted}>Enter the trip details before starting live GPS tracking.</Text>
            <TextInput
              value={form.driverName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, driverName: value }))}
              placeholder="Driver Name"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
            <TextInput
              value={form.busNumber}
              onChangeText={(value) => setForm((prev) => ({ ...prev, busNumber: value.toUpperCase() }))}
              placeholder="Bus Number"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              style={styles.input}
            />
            <TextInput
              value={form.routeNumber}
              onChangeText={(value) => setForm((prev) => ({ ...prev, routeNumber: value }))}
              placeholder="Route Number"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
            <TextInput
              value={form.shiftTiming}
              onChangeText={(value) => setForm((prev) => ({ ...prev, shiftTiming: value }))}
              placeholder="Shift Timing"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
            <TextInput
              value={form.routeName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, routeName: value }))}
              placeholder="Route Name (optional)"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
            <TouchableOpacity onPress={submitTrip} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Create Trip</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {trip && trip.status !== 'Completed' ? (
          <>
            <View style={styles.controlsCard}>
              <View style={styles.rowBetween}>
                <View style={styles.flexOne}>
                  <Text style={styles.cardTitle}>Trip Controls</Text>
                  <Text style={styles.muted}>
                    Status: {trip.status} {trip.status === 'In Progress' ? '• live' : trip.status === 'Paused' ? '• paused' : '• idle'}
                  </Text>
                </View>
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipText}>{gpsStatus}</Text>
                </View>
              </View>

              <TripControlButtons
                onStart={actions.startTrip}
                onPause={actions.pauseTrip}
                onEnd={endSession}
                startDisabled={!canStart}
                pauseDisabled={!canPause}
                endDisabled={!canEnd}
                startLabel={startLabel}
              />

              <View style={styles.metricsGrid}>
                <StatCard label="Join Code" value={trip.joinCode} hint="Share with students" accent="#111827" />
                <StatCard label="Status Timer" value={formatDuration(metrics?.durationMs || liveDurationMs)} hint="Elapsed trip time" accent="#111827" />
                <StatCard label="Distance" value={formatKm(metrics?.totalDistanceKm || 0)} hint="GPS path length" accent="#111827" />
                <StatCard label="Stops" value={`${metrics?.completedStops || 0}/${metrics?.totalStops || 0}`} hint="Completed stops" accent="#111827" />
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoPill}>
                  <Text style={styles.infoLabel}>Current stop</Text>
                  <Text style={styles.infoValue}>{currentStop?.name || 'Waiting for movement'}</Text>
                </View>
                <View style={styles.infoPill}>
                  <Text style={styles.infoLabel}>Next stop</Text>
                  <Text style={styles.infoValue}>{nextStop?.name || 'Waiting for movement'}</Text>
                </View>
              </View>
            </View>

            <DelayToggle
              value={Boolean(trip.delayed)}
              reason={trip.delayReason || ''}
              onChange={(value) => actions.setDelay({ delayed: value, reason: trip.delayReason })}
              onChangeReason={(text) => actions.setDelay({ delayed: true, reason: text })}
            />

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Add Stop</Text>
              <Text style={styles.muted}>Use live GPS if fields are empty, or manually enter exact coordinates.</Text>
              <TextInput
                value={stopDraft.name}
                onChangeText={(value) => setStopDraft((prev) => ({ ...prev, name: value }))}
                placeholder="Stop Name"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
              <View style={styles.twoCol}>
                <TextInput
                  value={stopDraft.latitude}
                  onChangeText={(value) => setStopDraft((prev) => ({ ...prev, latitude: value }))}
                  placeholder="Latitude"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  style={[styles.input, styles.half]}
                />
                <TextInput
                  value={stopDraft.longitude}
                  onChangeText={(value) => setStopDraft((prev) => ({ ...prev, longitude: value }))}
                  placeholder="Longitude"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  style={[styles.input, styles.half]}
                />
              </View>
              <View style={styles.twoCol}>
                <TextInput
                  value={stopDraft.scheduledTime}
                  onChangeText={(value) => setStopDraft((prev) => ({ ...prev, scheduledTime: value }))}
                  placeholder="Scheduled Time"
                  placeholderTextColor="#94A3B8"
                  style={[styles.input, styles.half]}
                />
                <TextInput
                  value={stopDraft.order}
                  onChangeText={(value) => setStopDraft((prev) => ({ ...prev, order: value }))}
                  placeholder="Order"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  style={[styles.input, styles.half]}
                />
              </View>
              <TouchableOpacity onPress={handleAddStop} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Add Stop</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mapCard}>
              <View style={styles.rowBetween}>
                <View style={styles.flexOne}>
                  <Text style={styles.cardTitle}>Live Map</Text>
                  <Text style={styles.muted}>
                    {trip.driverName} • Bus {trip.busNumber} • Route {trip.routeNumber}
                  </Text>
                </View>
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipText}>{trip.joinCode}</Text>
                </View>
              </View>
              <MapScreen
                currentLocation={trip.currentLocation}
                stops={decoratedStops}
                locationHistory={trip.locationHistory || []}
              />
            </View>

            <StopList
              stops={decoratedStops}
              onToggleComplete={actions.toggleStopComplete}
            />
          </>
        ) : null}

        {trip && trip.status === 'Completed' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Trip Summary</Text>
            <Text style={styles.muted}>Trip completed successfully. Start a new trip from the form above.</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Distance</Text>
              <Text style={styles.summaryValue}>{formatKm(trip.summary?.totalDistanceKm || 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{formatDuration(trip.summary?.durationMs || 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Stops</Text>
              <Text style={styles.summaryValue}>{trip.summary?.completedStops || 0} / {trip.summary?.totalStops || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Average Speed</Text>
              <Text style={styles.summaryValue}>{Number(trip.summary?.averageSpeed || 0).toFixed(2)} km/h</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Route Efficiency</Text>
              <Text style={styles.summaryValue}>{trip.summary?.routeEfficiency || 0}%</Text>
            </View>
          </View>
        ) : null}
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
  flexOne: {
    flex: 1
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
    borderColor: '#E5E7EB',
    gap: 10
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 14
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
    color: '#0F172A'
  },
  muted: {
    color: '#64748B'
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    marginTop: 10
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10
  },
  half: {
    flex: 1
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
    marginTop: 12,
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  statusChipText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 12
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10
  },
  infoPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '800'
  },
  infoValue: {
    marginTop: 6,
    color: '#0F172A',
    fontWeight: '800'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  summaryLabel: {
    color: '#64748B',
    fontWeight: '700'
  },
  summaryValue: {
    color: '#0F172A',
    fontWeight: '800'
  }
});
