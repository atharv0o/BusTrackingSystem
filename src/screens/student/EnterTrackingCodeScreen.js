import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, FormControl, Input, VStack, useToast } from 'native-base';
import { useDispatch, useSelector } from 'react-redux';
import CustomHeader from '../../components/CustomHeader';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS } from '../../utils/constants';
import { findActiveTripByTrackingCode, saveTrackingSession } from '../../services/firestore.service';
import { setSessionId, setStudentError, setStudentLoading, setTrackedTrip, setTrackingCode } from '../../store/slices/studentSlice';
import { normalizeTrackingCode } from '../../utils/helpers';

export default function EnterTrackingCodeScreen({ navigation }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.auth.user);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const normalized = normalizeTrackingCode(code);
    if (normalized.length !== 6) {
      setError('Tracking code must be 6 characters.');
      return;
    }

    try {
      setLoading(true);
      dispatch(setStudentLoading(true));
      const trip = await findActiveTripByTrackingCode(normalized);
      if (!trip || trip.tripData?.status === 'Completed') {
        setError('That code is invalid or the trip is no longer active.');
        dispatch(setStudentError('Invalid tracking code.'));
        return;
      }

      const sessionId = await saveTrackingSession({
        studentId: user?.uid || 'anonymous',
        driverId: trip.driverId,
        tripId: trip.id,
        code: normalized
      });

      dispatch(setTrackingCode(normalized));
      dispatch(setSessionId(sessionId));
      dispatch(
        setTrackedTrip({
          ...trip,
          path: trip.path,
          driver: {
            driverId: trip.driverId,
            driverName: trip.tripData?.driverName || '',
            busNumber: trip.tripData?.busNumber || '',
            routeNumber: trip.tripData?.routeNumber || ''
          }
        })
      );

      toast.show({ description: 'Tracking started.' });
      navigation.navigate('StudentTracking');
    } catch (trackingError) {
      const message = trackingError?.message || 'Unable to validate the tracking code.';
      setError(message);
      dispatch(setStudentError(message));
    } finally {
      setLoading(false);
      dispatch(setStudentLoading(false));
    }
  };

  return (
    <View style={styles.container}>
      <GridBackdrop />
      <CustomHeader title="Track Bus" subtitle="Enter the driver's 6-character tracking code." />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <VStack space={4} maxW={480} w="full" alignSelf="center">
            <FormControl isInvalid={Boolean(error)}>
              <FormControl.Label>Tracking Code</FormControl.Label>
              <Input
                value={code}
                onChangeText={(value) => setCode(normalizeTrackingCode(value))}
                placeholder="BUS2K9"
                autoCapitalize="characters"
                maxLength={6}
              />
              <FormControl.ErrorMessage>{error}</FormControl.ErrorMessage>
            </FormControl>

            <Button onPress={submit} isLoading={loading} colorScheme="primary">
              Track Bus
            </Button>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  flex: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16
  }
});
