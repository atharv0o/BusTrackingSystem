import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, FormControl, Input, Select, Text, VStack, useToast } from 'native-base';
import { useDispatch, useSelector } from 'react-redux';
import CustomHeader from '../../components/CustomHeader';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS } from '../../utils/constants';
import { createTrip, ensureDriverDocument, isBusNumberUnique } from '../../services/firestore.service';
import { setCurrentTrip, setDriverError, setDriverLoading } from '../../store/slices/driverSlice';
import { updateProfile } from '../../store/slices/authSlice';

const SHIFT_OPTIONS = ['06:00 AM - 02:00 PM', '08:00 AM - 04:00 PM', '10:00 AM - 06:00 PM', 'Custom'];

export default function TripStartScreen({ navigation }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.auth.user);
  const profile = useSelector((state) => state.auth.profile) || {};
  const [form, setForm] = useState({
    driverName: profile.name || '',
    busNumber: profile.busNumber || '',
    routeNumber: '',
    routeName: '',
    shiftTiming: SHIFT_OPTIONS[0]
  });
  const [customShift, setCustomShift] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    const resolvedShift = form.shiftTiming === 'Custom' ? customShift.trim() : form.shiftTiming;

    if (!form.driverName.trim() || !form.busNumber.trim() || !form.routeNumber.trim() || !resolvedShift) {
      setError('All fields are required.');
      return;
    }

    const normalizedBus = form.busNumber.trim().toUpperCase();

    try {
      setLoading(true);
      dispatch(setDriverLoading(true));

      const unique = await isBusNumberUnique(normalizedBus, user?.uid);
      if (!unique) {
        setError('That bus number is already in use.');
        return;
      }

      await ensureDriverDocument(user.uid, {
        name: form.driverName.trim(),
        email: user.email,
        phone: profile.phone || '',
        busNumber: normalizedBus
      });

      const trip = await createTrip({
        driverId: user.uid,
        tripData: {
          driverName: form.driverName.trim(),
          busNumber: normalizedBus,
          routeNumber: form.routeNumber.trim(),
          shiftTiming: resolvedShift
        },
        routeStops: [],
        routeName: form.routeName.trim() || form.routeNumber.trim()
      });

      dispatch(
        setCurrentTrip({
          driverId: user.uid,
          id: trip.tripId,
          path: `drivers/${user.uid}/trips/${trip.tripId}`,
          tripData: {
            driverName: form.driverName.trim(),
            busNumber: normalizedBus,
            routeNumber: form.routeNumber.trim(),
            shiftTiming: resolvedShift,
            status: 'Idle',
            driverId: user.uid
          },
          trackingCode: trip.trackingCode,
          routeStops: []
        })
      );
      dispatch(
        updateProfile({
          name: form.driverName.trim(),
          busNumber: normalizedBus
        })
      );

      toast.show({ description: 'Trip created successfully.' });
      navigation.navigate('ShareCode');
    } catch (tripError) {
      const message = tripError?.message || 'Unable to create trip.';
      setError(message);
      dispatch(setDriverError(message));
    } finally {
      setLoading(false);
      dispatch(setDriverLoading(false));
    }
  };

  return (
    <View style={styles.container}>
      <GridBackdrop />
      <CustomHeader title="Create Trip" subtitle="Enter the trip details before starting live tracking." />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <VStack space={4} maxW={560} w="full" alignSelf="center">
            <FormControl isInvalid={Boolean(error)}>
              <FormControl.Label>Driver Name</FormControl.Label>
              <Input value={form.driverName} onChangeText={(value) => update('driverName', value)} placeholder="Driver full name" />
            </FormControl>

            <FormControl isInvalid={Boolean(error)}>
              <FormControl.Label>Bus Number</FormControl.Label>
              <Input
                value={form.busNumber}
                onChangeText={(value) => update('busNumber', value.toUpperCase())}
                placeholder="BUS-102"
                autoCapitalize="characters"
              />
            </FormControl>

            <FormControl isInvalid={Boolean(error)}>
              <FormControl.Label>Route Number</FormControl.Label>
              <Input value={form.routeNumber} onChangeText={(value) => update('routeNumber', value)} placeholder="Route 8A" />
            </FormControl>

            <FormControl>
              <FormControl.Label>Route Name</FormControl.Label>
              <Input value={form.routeName} onChangeText={(value) => update('routeName', value)} placeholder="Optional route name" />
            </FormControl>

            <FormControl>
              <FormControl.Label>Shift Timing</FormControl.Label>
              <Select selectedValue={form.shiftTiming} onValueChange={(value) => update('shiftTiming', value)}>
                {SHIFT_OPTIONS.map((option) => (
                  <Select.Item key={option} label={option} value={option} />
                ))}
              </Select>
            </FormControl>

            {form.shiftTiming === 'Custom' ? (
              <FormControl isInvalid={Boolean(error)}>
                <FormControl.Label>Custom Shift Timing</FormControl.Label>
                <Input value={customShift} onChangeText={setCustomShift} placeholder="e.g. 07:15 AM - 03:30 PM" />
              </FormControl>
            ) : null}

            {error ? (
              <Text color="red.500" fontSize="sm">
                {error}
              </Text>
            ) : null}

            <Button onPress={submit} isLoading={loading} colorScheme="green">
              Create Trip
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
    padding: 16
  }
});
