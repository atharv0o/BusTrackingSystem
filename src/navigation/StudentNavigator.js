import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StudentDashboard from '../screens/student/StudentDashboard';
import EnterTrackingCodeScreen from '../screens/student/EnterTrackingCodeScreen';
import StudentTrackingScreen from '../screens/student/StudentTrackingScreen';
import BusInfoScreen from '../screens/student/BusInfoScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();

function iconFactory(name) {
  return ({ color, size }) => <MaterialCommunityIcons name={name} color={color} size={size} />;
}

export default function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mutedText,
        tabBarStyle: {
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.background
        }
      }}
    >
      <Tab.Screen name="StudentDashboard" component={StudentDashboard} options={{ title: 'Dashboard', tabBarIcon: iconFactory('view-dashboard') }} />
      <Tab.Screen name="EnterTrackingCode" component={EnterTrackingCodeScreen} options={{ title: 'Track Bus', tabBarIcon: iconFactory('ticket-confirmation') }} />
      <Tab.Screen name="StudentTracking" component={StudentTrackingScreen} options={{ title: 'Live Track', tabBarIcon: iconFactory('bus') }} />
      <Tab.Screen name="BusInfo" component={BusInfoScreen} options={{ title: 'Bus Info', tabBarIcon: iconFactory('information') }} />
    </Tab.Navigator>
  );
}
