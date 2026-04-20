import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Badge, Box, Button, HStack, Text, VStack } from 'native-base';
import { useDispatch, useSelector } from 'react-redux';
import CustomHeader from '../../components/CustomHeader';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS, TRIP_STATUS } from '../../utils/constants';
import { signOutSuccess } from '../../store/slices/authSlice';
import { resetDriverState } from '../../store/slices/driverSlice';
import { logoutUser } from '../../services/auth.service';

export default function DriverDashboard({ navigation }) {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.auth);
  const currentTrip = useSelector((state) => state.driver.currentTrip);
  const status = currentTrip?.tripData?.status || TRIP_STATUS.idle;
  const routeStops = currentTrip?.routeStops || [];

  const handleLogout = async () => {
    await logoutUser();
    dispatch(signOutSuccess());
    dispatch(resetDriverState());
  };

  return (
    <View style={styles.container}>
      <GridBackdrop />
      <CustomHeader
        title="Driver Dashboard"
        subtitle={`Welcome back${profile?.name ? `, ${profile.name}` : ''}. Track your trip and keep passengers updated.`}
        actionIcon="logout"
        onPressAction={handleLogout}
      />

      <VStack flex={1} px={4} space={4}>
        <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack space={1}>
              <Text fontSize="lg" fontWeight="800">
                Current Status
              </Text>
              <Text color={COLORS.mutedText}>{currentTrip?.tripData?.routeNumber || 'No active route'}</Text>
            </VStack>
            <Badge colorScheme={status === TRIP_STATUS.completed ? 'red' : status === TRIP_STATUS.inProgress ? 'green' : status === TRIP_STATUS.paused ? 'yellow' : 'coolGray'} rounded="full">
              {status}
            </Badge>
          </HStack>
        </Box>

        <HStack space={3}>
          <Button flex={1} onPress={() => navigation.navigate('TripStart')}>
            Create Trip
          </Button>
          <Button flex={1} variant="outline" onPress={() => navigation.navigate('TripControl')}>
            Controls
          </Button>
        </HStack>

        <HStack space={3}>
          <Button flex={1} variant="outline" onPress={() => navigation.navigate('LiveTracking')}>
            Live Map
          </Button>
          <Button flex={1} variant="outline" onPress={() => navigation.navigate('RouteStops')}>
            Stops
          </Button>
        </HStack>

        <Pressable onPress={() => navigation.navigate('TripSummary')}>
          <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
            <VStack space={2}>
              <Text fontSize="md" fontWeight="700">
                Trip Summary
              </Text>
              <Text color={COLORS.mutedText}>
                View distance, duration, stop progress, and route efficiency.
              </Text>
            </VStack>
          </Box>
        </Pressable>

        <Box p={4} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border}>
          <VStack space={1}>
            <Text fontSize="md" fontWeight="700">
              Active Stops
            </Text>
            <Text color={COLORS.mutedText}>
              {routeStops.length ? `${routeStops.length} stop(s) configured.` : 'No stops added yet.'}
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
  }
});
