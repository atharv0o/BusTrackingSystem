import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppStore } from '../storage/AppStore';
import LoadingScreen from '../screens/LoadingScreen';
import LaunchScreen from '../screens/LaunchScreen';
import AuthScreen from '../screens/AuthScreen';
import DriverDashboard from '../screens/DriverDashboard';
import StudentDashboard from '../screens/StudentDashboard';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { state } = useAppStore();

  if (!state.hydrated) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer key={state.session ? `${state.session.role}-${state.session.id}` : 'guest'}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={state.session ? 'Dashboard' : 'Launch'}>
        {!state.session ? (
          <>
            <Stack.Screen name="Launch" component={LaunchScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : state.session.role === 'driver' ? (
          <Stack.Screen name="Dashboard" component={DriverDashboard} />
        ) : (
          <Stack.Screen name="Dashboard" component={StudentDashboard} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
