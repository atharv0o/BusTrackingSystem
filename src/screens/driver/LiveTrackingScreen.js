import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Box, Divider, HStack, Spinner, Text, VStack } from 'native-base';
import { useDispatch, useSelector } from 'react-redux';
import CustomHeader from '../../components/CustomHeader';
import MapComponent, { Circle, Marker, Polyline } from '../../components/MapComponent';
import { COLORS, DEFAULT_MAP_DELTA, LOCATION_TRACKING_INTERVAL_MS } from '../../utils/constants';
import {
  buildStopsStatus,
  buildBoundingRegion,
  formatDateTime,
  generateRouteEtaMinutes,
  haversineDistanceKm,
  toGeoPoint
} from '../../utils/helpers';
import { useLocation } from '../../hooks/useLocation';
import { appendTripLocation } from '../../services/firestore.service';
import { setCurrentLocation, setConnectionStatus } from '../../store/slices/driverSlice';
import DriverInfoCard from '../../components/DriverInfoCard';

export default function LiveTrackingScreen() {
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const currentTrip = useSelector((state) => state.driver.currentTrip);
  const driverStatus = currentTrip?.tripData?.status || 'Idle';
  const currentLocationFromStore = useSelector((state) => state.driver.location);
  const [mapReady, setMapReady] = useState(false);
  const [lastSavedKey, setLastSavedKey] = useState('');
  const routeStops = currentTrip?.routeStops || [];
  const completedStopIds = currentTrip?.completedStopIds || [];
  const driverName = currentTrip?.tripData?.driverName || 'Driver';
  const busNumber = currentTrip?.tripData?.busNumber || '';
  const routeNumber = currentTrip?.tripData?.routeNumber || '';
  const liveEnabled = Boolean(currentTrip && driverStatus !== 'Completed');

  const { location, accuracy, tracking, error } = useLocation({
    enabled: liveEnabled,
    intervalMs: LOCATION_TRACKING_INTERVAL_MS
  });

  useEffect(() => {
    dispatch(setConnectionStatus(Boolean(tracking && !error)));
  }, [dispatch, tracking, error]);

  useEffect(() => {
    if (!location || !currentTrip?.id || driverStatus !== 'In Progress' || !currentTrip.driverId) {
      return;
    }

    const locationKey = `${location.latitude.toFixed(6)}:${location.longitude.toFixed(6)}`;
    if (locationKey === lastSavedKey) return;

    const persistLocation = async () => {
      await appendTripLocation({
        driverId: currentTrip.driverId,
        tripId: currentTrip.id,
        location,
        accuracy: location.accuracy
      });
      dispatch(setCurrentLocation(location));
      setLastSavedKey(locationKey);
    };

    persistLocation().catch(() => {});
  }, [currentTrip, dispatch, driverStatus, lastSavedKey, location]);

  const effectiveLocation = location || currentLocationFromStore || currentTrip?.currentLocation || null;
  const statusInfo = useMemo(() => buildStopsStatus(routeStops, completedStopIds, effectiveLocation), [completedStopIds, effectiveLocation, routeStops]);
  const decoratedStops = statusInfo.decoratedStops;
  const mapRegion = useMemo(() => {
    const points = [effectiveLocation, ...decoratedStops.map((stop) => toGeoPoint(stop)).filter(Boolean)];
    return buildBoundingRegion(points);
  }, [decoratedStops, effectiveLocation]);

  useEffect(() => {
    if (!mapRef.current || !effectiveLocation) return;

    mapRef.current.animateCamera?.({
      center: {
        latitude: effectiveLocation.latitude,
        longitude: effectiveLocation.longitude
      },
      zoom: 16
    });
  }, [effectiveLocation]);

  const routeLine = useMemo(() => {
    const coordinates = decoratedStops.map((stop) => toGeoPoint(stop)).filter(Boolean);
    return effectiveLocation ? [effectiveLocation, ...coordinates] : coordinates;
  }, [decoratedStops, effectiveLocation]);

  const nextStop = statusInfo.nextStop;
  const currentStop = statusInfo.currentStop;
  const etaMinutes =
    nextStop && effectiveLocation && nextStop.latitude && nextStop.longitude
      ? generateRouteEtaMinutes(
          haversineDistanceKm(effectiveLocation, {
            latitude: Number(nextStop.latitude),
            longitude: Number(nextStop.longitude)
          })
        )
      : null;

  return (
    <View style={styles.container}>
      <CustomHeader title="Live Tracking" subtitle="Driver GPS updates are pushed to Firestore every few seconds." />
      <VStack flex={1} px={4} space={3} pb={4}>
        <Box flex={1} rounded="3xl" overflow="hidden" borderWidth={1} borderColor={COLORS.border} bg="white">
          {currentTrip ? (
            <MapComponent
              ref={mapRef}
              mapReady={mapReady}
              initialRegion={
                mapRegion || {
                  latitude: effectiveLocation?.latitude || 20.5937,
                  longitude: effectiveLocation?.longitude || 78.9629,
                  latitudeDelta: DEFAULT_MAP_DELTA,
                  longitudeDelta: DEFAULT_MAP_DELTA
                }
              }
              onMapReady={() => setMapReady(true)}
              style={styles.map}
              showUserLocation
            >
              {effectiveLocation ? (
                <>
                  <Marker coordinate={effectiveLocation} title="Driver Location" pinColor="#2563EB" />
                  <Circle
                    center={effectiveLocation}
                    radius={Math.max(accuracy || 20, 20)}
                    strokeColor="rgba(37,99,235,0.25)"
                    fillColor="rgba(37,99,235,0.08)"
                  />
                </>
              ) : null}

              {routeLine.length > 1 ? <Polyline coordinates={routeLine} strokeColor="#D11D1D" strokeWidth={4} /> : null}

              {decoratedStops.map((stop) => (
                <Marker
                  key={stop.id}
                  coordinate={{ latitude: Number(stop.latitude), longitude: Number(stop.longitude) }}
                  title={stop.name}
                  description={`${stop.scheduledTime || 'No schedule'}${stop.distanceKm != null ? ` / ${stop.distanceKm.toFixed(2)} km away` : ''}`}
                  pinColor={stop.isCompleted ? '#16A34A' : stop.isCurrent ? '#EAB308' : '#7C3AED'}
                />
              ))}
            </MapComponent>
          ) : (
            <Box flex={1} alignItems="center" justifyContent="center" px={4}>
              <Spinner color={COLORS.primary} />
              <Text mt={3} color={COLORS.mutedText} textAlign="center">
                Create a trip first to begin live tracking.
              </Text>
            </Box>
          )}
        </Box>

        <DriverInfoCard
          driverName={driverName}
          busNumber={busNumber}
          routeNumber={routeNumber}
          currentStop={currentStop?.name}
          nextStop={nextStop?.name}
          etaText={etaMinutes ? `${etaMinutes} min` : 'Calculating...'}
          subtitle={`Status: ${driverStatus} / Last location ${effectiveLocation ? 'available' : 'pending'}`}
        />

        <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
          <VStack space={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="sm" color={COLORS.mutedText}>
                GPS Accuracy
              </Text>
              <Badge colorScheme={accuracy && accuracy <= 25 ? 'green' : 'yellow'} rounded="full">
                {accuracy ? `${Math.round(accuracy)}m` : 'Unknown'}
              </Badge>
            </HStack>
            <Divider />
            <Text fontSize="sm" color={COLORS.mutedText}>
              Trip started: {formatDateTime(currentTrip?.tripData?.startTime)}
            </Text>
          </VStack>
        </Box>
      </VStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  map: {
    flex: 1,
    minHeight: 360
  }
});
