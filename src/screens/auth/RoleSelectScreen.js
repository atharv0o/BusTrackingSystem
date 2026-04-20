import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HStack, Text, VStack, useToast } from 'native-base';
import { useDispatch, useSelector } from 'react-redux';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS, ROLE_TYPES } from '../../utils/constants';
import { updateRoleAndProfile } from '../../services/auth.service';
import { setAuthError, setAuthState, updateRole } from '../../store/slices/authSlice';

export default function RoleSelectScreen({ navigation }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector((state) => state.auth.user);
  const profile = useSelector((state) => state.auth.profile) || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectRole = async (role) => {
    try {
      setLoading(true);
      if (!user?.uid) {
        setError('Please log in again to continue.');
        return;
      }

      const nextProfile = { ...profile, role };
      await updateRoleAndProfile(user.uid, role, nextProfile);
      dispatch(updateRole(role));
      dispatch(setAuthState({ user, profile: nextProfile, role }));
      toast.show({ description: `Role set to ${role}.` });
    } catch (roleError) {
      const message = roleError?.message || 'Unable to update role.';
      setError(message);
      dispatch(setAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GridBackdrop />
      <VStack flex={1} justifyContent="center" px={4} space={6}>
        <VStack space={2} maxW={520} alignSelf="center">
          <Text fontSize="3xl" fontWeight="800" color={COLORS.text}>
            Choose your role
          </Text>
          <Text color={COLORS.mutedText}>
            Drivers manage trips and GPS updates. Students enter a code to follow a live bus.
          </Text>
        </VStack>

        <HStack space={4} maxW={520} alignSelf="center">
          <Button flex={1} colorScheme="primary" isLoading={loading} onPress={() => selectRole(ROLE_TYPES.driver)}>
            Driver
          </Button>
          <Button flex={1} variant="outline" isLoading={loading} onPress={() => selectRole(ROLE_TYPES.student)}>
            Student
          </Button>
        </HStack>

        {error ? (
          <Text alignSelf="center" color="red.500">
            {error}
          </Text>
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
