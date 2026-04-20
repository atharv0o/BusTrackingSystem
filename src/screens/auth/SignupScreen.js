import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  FormControl,
  Input,
  Select,
  Text,
  VStack,
  useToast
} from 'native-base';
import { useDispatch } from 'react-redux';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS, ROLE_TYPES } from '../../utils/constants';
import { signUpWithEmail } from '../../services/auth.service';
import { setAuthError, setAuthLoading, setAuthState } from '../../store/slices/authSlice';

export default function SignupScreen({ navigation }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    busNumber: '',
    role: ROLE_TYPES.driver
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    const requiredFields = ['name', 'email', 'password', 'confirmPassword', 'role'];
    const missing = requiredFields.some((field) => !String(form[field] || '').trim());
    if (missing) {
      setError('Please complete all required fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.role === ROLE_TYPES.driver && !form.busNumber.trim()) {
      setError('Bus number is required for drivers.');
      return;
    }

    try {
      setLoading(true);
      dispatch(setAuthLoading(true));
      const user = await signUpWithEmail({
        email: form.email,
        password: form.password,
        role: form.role,
        profile: {
          name: form.name,
          phone: form.phone,
          busNumber: form.role === ROLE_TYPES.driver ? form.busNumber : ''
        }
      });

      dispatch(
        setAuthState({
          user: { uid: user.uid, email: user.email },
          profile: {
            name: form.name,
            phone: form.phone,
            busNumber: form.role === ROLE_TYPES.driver ? form.busNumber : '',
            role: form.role
          },
          role: form.role
        })
      );

      toast.show({ description: 'Account created successfully.' });
    } catch (signupError) {
      const message = signupError?.message || 'Unable to create account.';
      setError(message);
      dispatch(setAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GridBackdrop />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <VStack space={4} maxW={520} w="full" alignSelf="center">
            <VStack space={1}>
              <Text fontSize="3xl" fontWeight="800" color={COLORS.text}>
                Create Account
              </Text>
              <Text color={COLORS.mutedText}>
                Set up your driver or student profile to get started.
              </Text>
            </VStack>

            <FormControl isInvalid={Boolean(error)}>
              <FormControl.Label>Full Name</FormControl.Label>
              <Input value={form.name} onChangeText={(value) => update('name', value)} placeholder="Your full name" />
            </FormControl>

            <FormControl isInvalid={Boolean(error)}>
              <FormControl.Label>Email</FormControl.Label>
              <Input
                value={form.email}
                onChangeText={(value) => update('email', value)}
                placeholder="name@school.edu"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </FormControl>

            <FormControl>
              <FormControl.Label>Phone Number</FormControl.Label>
              <Input value={form.phone} onChangeText={(value) => update('phone', value)} placeholder="Optional" keyboardType="phone-pad" />
            </FormControl>

            <FormControl isInvalid={Boolean(error)}>
              <FormControl.Label>Role</FormControl.Label>
              <Select selectedValue={form.role} onValueChange={(value) => update('role', value)} accessibilityLabel="Select role">
                <Select.Item label="Driver" value={ROLE_TYPES.driver} />
                <Select.Item label="Student" value={ROLE_TYPES.student} />
              </Select>
            </FormControl>

            {form.role === ROLE_TYPES.driver ? (
              <FormControl>
                <FormControl.Label>Bus Number</FormControl.Label>
                <Input
                  value={form.busNumber}
                  onChangeText={(value) => update('busNumber', value.toUpperCase())}
                  placeholder="BUS-12"
                  autoCapitalize="characters"
                />
              </FormControl>
            ) : null}

            <FormControl isInvalid={Boolean(error)}>
              <FormControl.Label>Password</FormControl.Label>
              <Input
                value={form.password}
                onChangeText={(value) => update('password', value)}
                placeholder="Create a strong password"
                secureTextEntry
              />
            </FormControl>

            <FormControl isInvalid={Boolean(error)}>
              <FormControl.Label>Confirm Password</FormControl.Label>
              <Input
                value={form.confirmPassword}
                onChangeText={(value) => update('confirmPassword', value)}
                placeholder="Re-enter password"
                secureTextEntry
              />
              <FormControl.ErrorMessage>{error}</FormControl.ErrorMessage>
            </FormControl>

            <Button onPress={submit} isLoading={loading} colorScheme="primary">
              Create Account
            </Button>

            <Button variant="ghost" onPress={() => navigation.navigate('Login')}>
              Back to login
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
