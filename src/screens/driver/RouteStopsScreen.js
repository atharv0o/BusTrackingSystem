import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Badge, Box, Button, Divider, FormControl, HStack, Input, Text, VStack } from 'native-base';
import { useDispatch, useSelector } from 'react-redux';
import CustomHeader from '../../components/CustomHeader';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS, STOP_PROXIMITY_METERS } from '../../utils/constants';
import { completeStop, updateTripStops } from '../../services/firestore.service';
import { setCurrentTrip } from '../../store/slices/driverSlice';
import { haversineDistanceKm } from '../../utils/helpers';

const emptyStop = {
  name: '',
  latitude: '',
  longitude: '',
  order: '',
  scheduledTime: ''
};

export default function RouteStopsScreen() {
  const dispatch = useDispatch();
  const currentTrip = useSelector((state) => state.driver.currentTrip);
  const currentLocation = useSelector((state) => state.driver.location);
  const [draft, setDraft] = useState(emptyStop);
  const [saving, setSaving] = useState(false);

  const routeStops = useMemo(() => {
    const stops = currentTrip?.routeStops || [];
    return [...stops].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  }, [currentTrip]);

  const nearestPendingStop = useMemo(() => {
    if (!currentLocation) return null;
    const pending = routeStops.filter((stop) => !currentTrip?.completedStopIds?.includes(stop.id));
    if (!pending.length) return null;

    const sorted = pending
      .map((stop) => ({
        ...stop,
        distanceKm: haversineDistanceKm(currentLocation, {
          latitude: Number(stop.latitude),
          longitude: Number(stop.longitude)
        })
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return sorted[0] || null;
  }, [currentLocation, currentTrip?.completedStopIds, routeStops]);

  const persistStops = async (nextStops) => {
    if (!currentTrip?.id || !currentTrip?.driverId) return;

    try {
      setSaving(true);
      await updateTripStops({
        driverId: currentTrip.driverId,
        tripId: currentTrip.id,
        stops: nextStops
      });
      dispatch(
        setCurrentTrip({
          ...currentTrip,
          routeStops: nextStops
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const addStop = async () => {
    if (!draft.name.trim() || !draft.latitude.trim() || !draft.longitude.trim()) return;

    const nextStops = [
      ...routeStops,
      {
        id: `${Date.now()}`,
        name: draft.name.trim(),
        latitude: Number(draft.latitude),
        longitude: Number(draft.longitude),
        order: Number(draft.order || routeStops.length + 1),
        scheduledTime: draft.scheduledTime.trim(),
        completed: false
      }
    ].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    await persistStops(nextStops);
    setDraft(emptyStop);
  };

  const markStopCompleted = async (stop) => {
    if (!currentTrip?.driverId || !currentTrip?.id || stop.completed) return;

    await completeStop({
      driverId: currentTrip.driverId,
      tripId: currentTrip.id,
      stopId: stop.id
    });

    dispatch(
      setCurrentTrip({
        ...currentTrip,
        completedStopIds: [...new Set([...(currentTrip.completedStopIds || []), stop.id])]
      })
    );
  };

  return (
    <View style={styles.container}>
      <GridBackdrop />
      <CustomHeader title="Route Stops" subtitle="Manage route stops and mark them complete as you pass them." />

      <VStack flex={1} px={4} space={4} pb={4}>
        <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
          <VStack space={3}>
            <Text fontSize="md" fontWeight="700">
              Add Stop
            </Text>
            <FormControl>
              <FormControl.Label>Stop Name</FormControl.Label>
              <Input value={draft.name} onChangeText={(value) => setDraft((current) => ({ ...current, name: value }))} />
            </FormControl>
            <HStack space={3}>
              <FormControl flex={1}>
                <FormControl.Label>Latitude</FormControl.Label>
                <Input value={draft.latitude} onChangeText={(value) => setDraft((current) => ({ ...current, latitude: value }))} keyboardType="decimal-pad" />
              </FormControl>
              <FormControl flex={1}>
                <FormControl.Label>Longitude</FormControl.Label>
                <Input value={draft.longitude} onChangeText={(value) => setDraft((current) => ({ ...current, longitude: value }))} keyboardType="decimal-pad" />
              </FormControl>
            </HStack>
            <HStack space={3}>
              <FormControl flex={1}>
                <FormControl.Label>Order</FormControl.Label>
                <Input value={draft.order} onChangeText={(value) => setDraft((current) => ({ ...current, order: value }))} keyboardType="number-pad" />
              </FormControl>
              <FormControl flex={1}>
                <FormControl.Label>Scheduled Time</FormControl.Label>
                <Input value={draft.scheduledTime} onChangeText={(value) => setDraft((current) => ({ ...current, scheduledTime: value }))} placeholder="08:25 AM" />
              </FormControl>
            </HStack>
            <Button onPress={addStop} isLoading={saving}>
              Add Stop
            </Button>
          </VStack>
        </Box>

        {nearestPendingStop && currentLocation ? (
          <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
            <VStack space={2}>
              <Text fontSize="md" fontWeight="700">
                Auto-detected nearby stop
              </Text>
              <Text color={COLORS.mutedText}>
                {nearestPendingStop.name} is within {Math.round(nearestPendingStop.distanceKm * 1000)} meters.
              </Text>
              {nearestPendingStop.distanceKm * 1000 <= STOP_PROXIMITY_METERS ? (
                <Button onPress={() => markStopCompleted(nearestPendingStop)} colorScheme="green">
                  Mark as Stop
                </Button>
              ) : null}
            </VStack>
          </Box>
        ) : null}

        <Box flex={1} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border} overflow="hidden">
          <FlatList
            data={routeStops}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider />}
            renderItem={({ item }) => {
              const isCompleted = currentTrip?.completedStopIds?.includes(item.id) || item.completed;
              const distanceKm = currentLocation
                ? haversineDistanceKm(currentLocation, {
                    latitude: Number(item.latitude),
                    longitude: Number(item.longitude)
                  })
                : null;

              return (
                <Pressable onPress={() => markStopCompleted(item)}>
                  <Box px={4} py={3} opacity={isCompleted ? 0.7 : 1}>
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack flex={1} space={1}>
                        <Text fontWeight="700" color={isCompleted ? 'green.600' : COLORS.text}>
                          {item.name}
                        </Text>
                        <Text fontSize="xs" color={COLORS.mutedText}>
                          {item.scheduledTime || 'No schedule'} / Order {item.order || '-'}
                        </Text>
                        <Text fontSize="xs" color={COLORS.mutedText}>
                          {distanceKm != null ? `${distanceKm.toFixed(2)} km from current location` : 'Location pending'}
                        </Text>
                      </VStack>
                      <Badge colorScheme={isCompleted ? 'green' : 'purple'} rounded="full">
                        {isCompleted ? 'Completed' : 'Upcoming'}
                      </Badge>
                    </HStack>
                  </Box>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Box p={6} alignItems="center">
                <Text color={COLORS.mutedText}>No stops configured yet.</Text>
              </Box>
            }
          />
        </Box>
      </VStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  }
});
