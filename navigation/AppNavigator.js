import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAppStore } from "../storage/AppStore";
import LoadingScreen from "../screens/LoadingScreen";
import LaunchScreen from "../screens/LaunchScreen";
import AuthScreen from "../screens/AuthScreen";

const Stack = createStackNavigator();

function DriverDashboardScreen(props) {
  const Screen = require("../screens/DriverDashboard").default;
  return <Screen {...props} />;
}

function StudentDashboardScreen(props) {
  const Screen = require("../screens/StudentDashboard").default;
  return <Screen {...props} />;
}

export default function AppNavigator() {
  const { state } = useAppStore();

  if (!state.hydrated) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      key={
        state.session ? `${state.session.role}-${state.session.id}` : "guest"
      }
    >
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={state.session ? "Dashboard" : "Launch"}
      >
        {!state.session ? (
          <>
            <Stack.Screen name="Launch" component={LaunchScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : state.session.role === "driver" ? (
          <Stack.Screen name="Dashboard" component={DriverDashboardScreen} />
        ) : (
          <Stack.Screen name="Dashboard" component={StudentDashboardScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
