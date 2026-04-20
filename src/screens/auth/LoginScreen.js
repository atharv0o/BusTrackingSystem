import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, FormControl, Input, Pressable, Text, VStack, useToast } from 'native-base';
import { useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS } from '../../utils/constants';
import { loadUserProfile, signInWithEmail } from '../../services/auth.service';
import { setAuthError, setAuthLoading, setAuthState } from '../../store/slices/authSlice';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setLocalError('Email and password are required.');
      return;
    }

    try {
      setSubmitting(true);
      dispatch(setAuthLoading(true));
      const user = await signInWithEmail({ email, password });
      const profile = await loadUserProfile(user.uid);
      dispatch(setAuthState({ user: { uid: user.uid, email: user.email }, profile, role: profile?.role || null }));
      toast.show({
        description: 'Signed in successfully.'
      });
    } catch (error) {
      const message = error?.message || 'Unable to sign in right now.';
      setLocalError(message);
      dispatch(setAuthError(message));
    } finally {
      setSubmitting(false);
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
          <VStack space={5} maxW={460} w="full" alignSelf="center">
            <VStack space={1}>
              <Text fontSize="3xl" fontWeight="800" color={COLORS.text}>
                Real-Time Bus Tracking
              </Text>
              <Text color={COLORS.mutedText}>
                Sign in to track trips, manage stops, and keep students updated in real time.
              </Text>
            </VStack>

            <FormControl isInvalid={Boolean(localError)}>
              <FormControl.Label>Email</FormControl.Label>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="driver@school.edu"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </FormControl>

            <FormControl isInvalid={Boolean(localError)}>
              <FormControl.Label>Password</FormControl.Label>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                InputRightElement={
                  <Pressable onPress={() => setShowPassword((value) => !value)}>
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={COLORS.mutedText}
                      style={{ marginRight: 14 }}
                    />
                  </Pressable>
                }
              />
              <FormControl.ErrorMessage>{localError}</FormControl.ErrorMessage>
            </FormControl>

            <Button onPress={onSubmit} isLoading={submitting} colorScheme="primary">
              Log In
            </Button>

            <Button variant="ghost" onPress={() => navigation.navigate('Signup')}>
              Create an account
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
