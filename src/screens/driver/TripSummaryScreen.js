import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Box, Button, Divider, HStack, Text, VStack } from 'native-base';
import { useSelector } from 'react-redux';
import CustomHeader from '../../components/CustomHeader';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS } from '../../utils/constants';
import {
  calculateAverageSpeed,
  calculatePathDistanceKm,
  formatDuration,
  getRouteEfficiency
} from '../../utils/helpers';

export default function TripSummaryScreen({ navigation }) {
  const currentTrip = useSelector((state) => state.driver.currentTrip);
  const summary = useSelector((state) => state.driver.summary);

  const metrics = useMemo(() => {
    const locations = currentTrip?.locations || [];
    const points = locations
      .map((location) => ({
        latitude: Number(location.latitude),
        longitude: Number(location.longitude)
      }))
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

    const distanceKm = calculatePathDistanceKm(points);
    const start = currentTrip?.tripData?.startTime?.toDate ? currentTrip.tripData.startTime.toDate() : currentTrip?.tripData?.startTime ? new Date(currentTrip.tripData.startTime) : null;
    const end = currentTrip?.tripData?.endTime?.toDate ? currentTrip.tripData.endTime.toDate() : currentTrip?.tripData?.endTime ? new Date(currentTrip.tripData.endTime) : new Date();
    const durationMs = start ? Math.max(0, end.getTime() - start.getTime()) : 0;
    const averageSpeed = calculateAverageSpeed(distanceKm, durationMs);
    const completedStops = currentTrip?.completedStopIds?.length || 0;
    const totalStops = currentTrip?.routeStops?.length || 0;
    const routePath = (currentTrip?.routeStops || [])
      .map((stop) => ({
        latitude: Number(stop.latitude),
        longitude: Number(stop.longitude)
      }))
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
    const plannedDistanceKm = calculatePathDistanceKm(routePath) || distanceKm || 1;
    const routeEfficiency = getRouteEfficiency({
      plannedDistanceKm,
      actualDistanceKm: distanceKm
    });

    return {
      distanceKm,
      durationMs,
      averageSpeed,
      completedStops,
      totalStops,
      routeEfficiency
    };
  }, [currentTrip]);

  return (
    <View style={styles.container}>
      <GridBackdrop />
      <CustomHeader title="Trip Summary" subtitle="Review the trip metrics after the run ends." />

      <VStack flex={1} px={4} space={4} pb={4}>
        <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
          <VStack space={3}>
            <Text fontSize="md" fontWeight="700">
              Trip Report
            </Text>
            <Divider />
            <MetricRow label="Total Distance" value={`${metrics.distanceKm.toFixed(2)} km`} />
            <MetricRow label="Total Duration" value={formatDuration(metrics.durationMs)} />
            <MetricRow label="Stops Completed" value={`${metrics.completedStops} / ${metrics.totalStops}`} />
            <MetricRow label="Delay Status" value={currentTrip?.delay?.isDelayed ? `Yes${currentTrip.delay.reason ? `, ${currentTrip.delay.reason}` : ''}` : 'No'} />
            <MetricRow label="Average Speed" value={`${metrics.averageSpeed.toFixed(2)} km/h`} />
            <MetricRow label="Route Efficiency" value={`${metrics.routeEfficiency}%`} />
            <MetricRow label="Sharing Code" value={currentTrip?.trackingCode || 'Not generated yet'} />
          </VStack>
        </Box>

        {summary ? (
          <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
            <Text fontWeight="700">Saved Summary</Text>
            <Text color={COLORS.mutedText}>{JSON.stringify(summary, null, 2)}</Text>
          </Box>
        ) : null}

        <HStack space={3}>
          <Button flex={1} onPress={() => navigation.navigate('ShareCode')}>
            Generate Sharing Code
          </Button>
          <Button flex={1} variant="outline" onPress={() => navigation.navigate('DriverDashboard')}>
            End Session
          </Button>
        </HStack>
      </VStack>
    </View>
  );
}

function MetricRow({ label, value }) {
  return (
    <HStack justifyContent="space-between" space={3}>
      <Text color={COLORS.mutedText}>{label}</Text>
      <Text fontWeight="700" textAlign="right" flexShrink={1}>
        {value}
      </Text>
    </HStack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  }
});
