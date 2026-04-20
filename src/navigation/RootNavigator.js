import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { Box, Center, Spinner, Text, VStack } from 'native-base';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import DriverNavigator from './DriverNavigator';
import StudentNavigator from './StudentNavigator';
import { COLORS } from '../utils/constants';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
    </Stack.Navigator>
  );
}

function BootScreen() {
  return (
    <Center flex={1} bg={COLORS.background}>
      <VStack space={4} alignItems="center">
        <Spinner size="lg" color={COLORS.primary} />
        <Text color={COLORS.mutedText}>Preparing your tracking workspace...</Text>
      </VStack>
    </Center>
  );
}

export default function RootNavigator() {
  const { hydrated, loading, user, role } = useSelector((state) => state.auth);

  if (!hydrated || loading) {
    return <BootScreen />;
  }

  return (
    <NavigationContainer>
      <Box flex={1} bg={COLORS.background}>
        {!user ? (
          <AuthStack />
        ) : !role ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
          </Stack.Navigator>
        ) : role === 'driver' ? (
          <DriverNavigator />
        ) : role === 'student' ? (
          <StudentNavigator />
        ) : (
          <AuthStack />
        )}
      </Box>
    </NavigationContainer>
  );
}
