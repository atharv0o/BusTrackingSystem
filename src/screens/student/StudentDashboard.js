import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Badge, Box, Button, HStack, Text, VStack } from 'native-base';
import { useDispatch, useSelector } from 'react-redux';
import CustomHeader from '../../components/CustomHeader';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS } from '../../utils/constants';
import { clearTracking, setStudentError } from '../../store/slices/studentSlice';
import { endTrackingSession } from '../../services/firestore.service';

export default function StudentDashboard({ navigation }) {
  const dispatch = useDispatch();
  const trackedTrip = useSelector((state) => state.student.trackedTrip);
  const code = useSelector((state) => state.student.trackingCode);
  const sessionId = useSelector((state) => state.student.sessionId);

  const stopTracking = async () => {
    if (sessionId) {
      await endTrackingSession(sessionId);
    }
    dispatch(clearTracking());
  };

  return (
    <View style={styles.container}>
      <GridBackdrop />
      <CustomHeader title="Student Dashboard" subtitle="Enter a code to see a live bus on the map." />

      <VStack flex={1} px={4} space={4}>
        <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack space={1}>
              <Text fontSize="md" fontWeight="700">
                Tracking State
              </Text>
              <Text color={COLORS.mutedText}>
                {trackedTrip ? `Tracking ${trackedTrip.trackingCode || code || 'trip'}` : 'No trip selected'}
              </Text>
            </VStack>
            <Badge colorScheme={trackedTrip ? 'green' : 'coolGray'} rounded="full">
              {trackedTrip ? 'Active' : 'Idle'}
            </Badge>
          </HStack>
        </Box>

        <Pressable onPress={() => navigation.navigate('EnterTrackingCode')}>
          <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
            <Text fontWeight="700">Enter Tracking Code</Text>
            <Text color={COLORS.mutedText} mt={1}>
              Use the 6-character code shared by the driver to start live tracking.
            </Text>
          </Box>
        </Pressable>

        <HStack space={3}>
          <Button flex={1} onPress={() => navigation.navigate('StudentTracking')}>
            Live Tracking
          </Button>
          <Button flex={1} variant="outline" onPress={() => navigation.navigate('BusInfo')}>
            Bus Info
          </Button>
        </HStack>

        {trackedTrip ? (
          <Button variant="ghost" colorScheme="red" onPress={stopTracking}>
            Stop Tracking
          </Button>
        ) : null}
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
