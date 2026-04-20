import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Box, Divider, HStack, Text, VStack } from 'native-base';
import { useDispatch, useSelector } from 'react-redux';
import CustomHeader from '../../components/CustomHeader';
import TripControlButtons from '../../components/TripControlButtons';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS, TRIP_STATUS } from '../../utils/constants';
import { formatDuration } from '../../utils/helpers';
import { finalizeTripSummary, setTripStatus } from '../../services/firestore.service';
import { setCurrentTrip, setTripStatus as setDriverStatus } from '../../store/slices/driverSlice';

export default function TripControlScreen({ navigation }) {
  const dispatch = useDispatch();
  const currentTrip = useSelector((state) => state.driver.currentTrip);
  const gpsConnected = useSelector((state) => state.driver.isLocationConnected);
  const status = currentTrip?.tripData?.status || TRIP_STATUS.idle;
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const start = currentTrip?.tripData?.startTime?.toDate ? currentTrip.tripData.startTime.toDate() : currentTrip?.tripData?.startTime ? new Date(currentTrip.tripData.startTime) : null;
      if (start) {
        setElapsedMs(Date.now() - start.getTime());
      } else {
        setElapsedMs(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTrip?.tripData?.startTime]);

  const canStart = Boolean(currentTrip && status === TRIP_STATUS.idle);
  const canPause = status === TRIP_STATUS.inProgress;
  const canEnd = status === TRIP_STATUS.inProgress || status === TRIP_STATUS.paused;

  const updateStatus = async (nextStatus, timestampField = null) => {
    if (!currentTrip?.id || !currentTrip?.driverId) return;

    await setTripStatus({
      driverId: currentTrip.driverId,
      tripId: currentTrip.id,
      status: nextStatus,
      timestampField
    });

    dispatch(setDriverStatus(nextStatus));
    dispatch(
      setCurrentTrip({
        ...currentTrip,
        tripData: {
          ...(currentTrip.tripData || {}),
          status: nextStatus,
          [timestampField || 'updatedAt']: new Date()
        }
      })
    );
  };

  const handleStart = async () => {
    await updateStatus(TRIP_STATUS.inProgress, 'startTime');
  };

  const handlePause = async () => {
    await updateStatus(TRIP_STATUS.paused);
  };

  const handleEnd = async () => {
    if (!currentTrip?.id || !currentTrip?.driverId) return;

    const summary = {
      closedAt: new Date().toISOString(),
      status: TRIP_STATUS.completed
    };

    await finalizeTripSummary({
      driverId: currentTrip.driverId,
      tripId: currentTrip.id,
      summary
    });
    dispatch(setDriverStatus(TRIP_STATUS.completed));
    dispatch(setCurrentTrip({
      ...currentTrip,
      tripData: {
        ...(currentTrip.tripData || {}),
        status: TRIP_STATUS.completed,
        endTime: new Date()
      }
    }));
    navigation.navigate('TripSummary');
  };

  return (
    <View style={styles.container}>
      <GridBackdrop />
      <CustomHeader title="Trip Controls" subtitle="Start, pause, or end the active trip from one place." />

      <VStack flex={1} px={4} space={4} pb={4}>
        <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
          <VStack space={3}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="md" fontWeight="700">
                Trip Status
              </Text>
              <Badge
                colorScheme={status === TRIP_STATUS.inProgress ? 'green' : status === TRIP_STATUS.paused ? 'yellow' : status === TRIP_STATUS.completed ? 'red' : 'coolGray'}
                rounded="full"
              >
                {status}
              </Badge>
            </HStack>
            <Divider />
            <Text color={COLORS.mutedText}>Elapsed Time: {formatDuration(elapsedMs)}</Text>
            <Text color={COLORS.mutedText}>
              GPS Status: {gpsConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </VStack>
        </Box>

        <TripControlButtons
          onStart={handleStart}
          onPause={handlePause}
          onEnd={handleEnd}
          startDisabled={!canStart}
          pauseDisabled={!canPause}
          endDisabled={!canEnd}
        />
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
