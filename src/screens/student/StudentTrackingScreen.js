import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Box, Divider, HStack, Spinner, Text, VStack } from 'native-base';
import { useDispatch, useSelector } from 'react-redux';
import CustomHeader from '../../components/CustomHeader';
import MapComponent, { Circle, Marker, Polyline } from '../../components/MapComponent';
import DriverInfoCard from '../../components/DriverInfoCard';
import { COLORS, BUS_RADIUS_METERS, DEFAULT_MAP_DELTA, ETA_REFRESH_INTERVAL_MS } from '../../utils/constants';
import { useFirestoreDocument } from '../../hooks/useFirestore';
import { buildBoundingRegion, buildStopsStatus, formatDateTime, generateRouteEtaMinutes, haversineDistanceKm, toGeoPoint } from '../../utils/helpers';
import { setTrackedTrip } from '../../store/slices/studentSlice';

export default function StudentTrackingScreen() {
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const trackedTrip = useSelector((state) => state.student.trackedTrip);
  const tripPath = trackedTrip?.path;
  const { data: liveTrip, loading } = useFirestoreDocument(tripPath, Boolean(tripPath));
  const [mapReady, setMapReady] = useState(false);
  const [etaTick, setEtaTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setEtaTick(Date.now()), ETA_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (liveTrip) {
      dispatch(setTrackedTrip({ ...liveTrip, path: tripPath, driver: trackedTrip?.driver }));
    }
  }, [dispatch, liveTrip, trackedTrip?.driver, tripPath]);

  const trip = liveTrip || trackedTrip;
  const currentLocation = trip?.currentLocation || null;
  const routeStops = trip?.routeStops || [];
  const completedStopIds = trip?.completedStopIds || [];
  const stopsInfo = useMemo(() => buildStopsStatus(routeStops, completedStopIds, currentLocation), [completedStopIds, currentLocation, routeStops]);
  const routePoints = useMemo(
    () => [currentLocation, ...routeStops.map((stop) => toGeoPoint(stop)).filter(Boolean)].filter(Boolean),
    [currentLocation, routeStops]
  );
  const region = useMemo(() => buildBoundingRegion(routePoints), [routePoints]);
  const nextStop = stopsInfo.nextStop;
  const currentStop = stopsInfo.currentStop;
  const distanceToNext = currentLocation && nextStop
    ? haversineDistanceKm(currentLocation, {
        latitude: Number(nextStop.latitude),
        longitude: Number(nextStop.longitude)
      })
    : null;
  const etaMinutes = distanceToNext != null ? generateRouteEtaMinutes(distanceToNext) : null;

  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;
    mapRef.current.animateCamera?.({
      center: {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      },
      zoom: 15
    });
  }, [currentLocation]);

  return (
    <View style={styles.container}>
      <CustomHeader title="Student Tracking" subtitle="Follow the bus in real time." />
      <VStack flex={1} px={4} space={3} pb={4}>
        <Box flex={1} rounded="3xl" overflow="hidden" borderWidth={1} borderColor={COLORS.border} bg="white">
          {trip ? (
            <MapComponent
              ref={mapRef}
              mapReady={mapReady}
              initialRegion={
                region || {
                  latitude: currentLocation?.latitude || 20.5937,
                  longitude: currentLocation?.longitude || 78.9629,
                  latitudeDelta: DEFAULT_MAP_DELTA,
                  longitudeDelta: DEFAULT_MAP_DELTA
                }
              }
              onMapReady={() => setMapReady(true)}
              style={styles.map}
              showUserLocation={false}
            >
              {currentLocation ? (
                <>
                  <Marker coordinate={currentLocation} title="Bus" pinColor="#2563EB" />
                  <Circle center={currentLocation} radius={BUS_RADIUS_METERS} strokeColor="rgba(16,163,74,0.25)" fillColor="rgba(16,163,74,0.08)" />
                </>
              ) : null}

              {routePoints.length > 1 ? <Polyline coordinates={routePoints} strokeColor="#D1D5DB" strokeWidth={3} /> : null}

              {nextStop ? (
                <Marker
                  coordinate={{ latitude: Number(nextStop.latitude), longitude: Number(nextStop.longitude) }}
                  title={`Next Stop: ${nextStop.name}`}
                  description={nextStop.scheduledTime || 'No schedule'}
                  pinColor="#16A34A"
                />
              ) : null}

              {stopsInfo.decoratedStops.map((stop) => (
                <Marker
                  key={stop.id}
                  coordinate={{ latitude: Number(stop.latitude), longitude: Number(stop.longitude) }}
                  title={stop.name}
                  pinColor={stop.isCompleted ? '#16A34A' : stop.isCurrent ? '#EAB308' : '#7C3AED'}
                />
              ))}
            </MapComponent>
          ) : (
            <Box flex={1} alignItems="center" justifyContent="center" px={4}>
              <Spinner color={COLORS.primary} />
              <Text mt={3} color={COLORS.mutedText} textAlign="center">
                Enter a valid tracking code to load the live bus map.
              </Text>
            </Box>
          )}
        </Box>

        <DriverInfoCard
          driverName={trip?.driver?.driverName || trip?.tripData?.driverName}
          busNumber={trip?.driver?.busNumber || trip?.tripData?.busNumber}
          routeNumber={trip?.driver?.routeNumber || trip?.tripData?.routeNumber}
          currentStop={currentStop?.name}
          nextStop={nextStop?.name}
          etaText={etaMinutes ? `${etaMinutes} min` : 'Calculating...'}
          subtitle={`Last updated ${formatDateTime(trip?.updatedAt || etaTick)}`}
        />

        <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
          <VStack space={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text color={COLORS.mutedText}>Distance to next stop</Text>
              <Badge rounded="full" colorScheme="primary">
                {distanceToNext != null ? `${distanceToNext.toFixed(2)} km` : 'N/A'}
              </Badge>
            </HStack>
            <Divider />
            <Text color={COLORS.mutedText}>
              Green circle shows the 500m walking zone around the bus.
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
