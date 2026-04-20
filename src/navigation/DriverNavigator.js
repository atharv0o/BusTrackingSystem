import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import DriverDashboard from '../screens/driver/DriverDashboard';
import TripStartScreen from '../screens/driver/TripStartScreen';
import LiveTrackingScreen from '../screens/driver/LiveTrackingScreen';
import RouteStopsScreen from '../screens/driver/RouteStopsScreen';
import TripControlScreen from '../screens/driver/TripControlScreen';
import TripSummaryScreen from '../screens/driver/TripSummaryScreen';
import ShareCodeScreen from '../screens/driver/ShareCodeScreen';
import { COLORS } from '../utils/constants';
import { useFirestoreDocument } from '../hooks/useFirestore';
import { setCurrentLocation, setCurrentTrip, setTripStatus } from '../store/slices/driverSlice';

const Tab = createBottomTabNavigator();

function DriverSessionHydrator() {
  const dispatch = useDispatch();
  const activeTripId = useSelector((state) => state.auth.profile?.activeTripId);
  const driverId = useSelector((state) => state.auth.user?.uid);
  const currentTrip = useSelector((state) => state.driver.currentTrip);
  const { data: activeTrip } = useFirestoreDocument(
    driverId && activeTripId ? `drivers/${driverId}/trips/${activeTripId}` : null,
    Boolean(driverId && activeTripId)
  );

  useEffect(() => {
    if (!activeTrip || currentTrip?.id === activeTrip.id) return;
    dispatch(setCurrentTrip({ ...activeTrip, driverId, path: `drivers/${driverId}/trips/${activeTripId}` }));
    dispatch(setTripStatus(activeTrip?.tripData?.status || 'Idle'));
    if (activeTrip.currentLocation) {
      dispatch(setCurrentLocation(activeTrip.currentLocation));
    }
  }, [activeTrip, activeTripId, currentTrip?.id, dispatch, driverId]);

  return null;
}

function iconFactory(name) {
  return ({ color, size }) => <MaterialCommunityIcons name={name} color={color} size={size} />;
}

export default function DriverNavigator() {
  return (
    <>
      <DriverSessionHydrator />
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
        <Tab.Screen name="DriverDashboard" component={DriverDashboard} options={{ title: 'Dashboard', tabBarIcon: iconFactory('view-dashboard') }} />
        <Tab.Screen name="TripStart" component={TripStartScreen} options={{ title: 'Create Trip', tabBarIcon: iconFactory('bus-plus') }} />
        <Tab.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ title: 'Live Map', tabBarIcon: iconFactory('map-marker-path') }} />
        <Tab.Screen name="RouteStops" component={RouteStopsScreen} options={{ title: 'Stops', tabBarIcon: iconFactory('map-marker-check') }} />
        <Tab.Screen name="TripControl" component={TripControlScreen} options={{ title: 'Control', tabBarIcon: iconFactory('play-pause') }} />
        <Tab.Screen name="TripSummary" component={TripSummaryScreen} options={{ title: 'Summary', tabBarIcon: iconFactory('chart-box') }} />
        <Tab.Screen name="ShareCode" component={ShareCodeScreen} options={{ title: 'Code', tabBarIcon: iconFactory('qrcode') }} />
      </Tab.Navigator>
    </>
  );
}
