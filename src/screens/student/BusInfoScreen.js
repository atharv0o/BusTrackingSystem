import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Box, Divider, Text, VStack, useToast } from 'native-base';
import * as Clipboard from 'expo-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import CustomHeader from '../../components/CustomHeader';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS } from '../../utils/constants';
import { clearTracking } from '../../store/slices/studentSlice';
import { endTrackingSession } from '../../services/firestore.service';

export default function BusInfoScreen() {
  const toast = useToast();
  const dispatch = useDispatch();
  const trackedTrip = useSelector((state) => state.student.trackedTrip);
  const sessionId = useSelector((state) => state.student.sessionId);

  const stopTracking = async () => {
    if (sessionId) {
      await endTrackingSession(sessionId);
    }
    dispatch(clearTracking());
  };

  const shareCode = async () => {
    if (!trackedTrip?.trackingCode) return;
    await Clipboard.setStringAsync(trackedTrip.trackingCode);
    toast.show({ description: 'Tracking code copied.' });
  };

  return (
    <View style={styles.container}>
      <GridBackdrop />
      <CustomHeader title="Bus Info" subtitle="Driver and trip details at a glance." />

      <VStack flex={1} px={4} space={4} pb={4}>
        <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
          <VStack space={2}>
            <Text fontWeight="700">Driver Name</Text>
            <Text color={COLORS.mutedText}>{trackedTrip?.driver?.driverName || trackedTrip?.tripData?.driverName || 'Not available'}</Text>
            <Divider />
            <Text fontWeight="700">Bus Number</Text>
            <Text color={COLORS.mutedText}>{trackedTrip?.driver?.busNumber || trackedTrip?.tripData?.busNumber || 'Not available'}</Text>
            <Divider />
            <Text fontWeight="700">Route Number</Text>
            <Text color={COLORS.mutedText}>{trackedTrip?.driver?.routeNumber || trackedTrip?.tripData?.routeNumber || 'Not available'}</Text>
            <Divider />
            <Text fontWeight="700">Current Stop</Text>
            <Text color={COLORS.mutedText}>{trackedTrip?.tripData?.currentStop || 'Tracking live position'}</Text>
            <Divider />
            <Text fontWeight="700">Last Updated</Text>
            <Text color={COLORS.mutedText}>{trackedTrip?.updatedAt?.toDate ? trackedTrip.updatedAt.toDate().toLocaleString() : 'Just now'}</Text>
          </VStack>
        </Box>

        <Button onPress={shareCode} isDisabled={!trackedTrip?.trackingCode}>
          Share Tracking Code
        </Button>
        <Button variant="outline" colorScheme="red" onPress={stopTracking}>
          Stop Tracking
        </Button>
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
