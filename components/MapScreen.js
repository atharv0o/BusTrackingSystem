import React, { useEffect, useMemo, useRef } from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
import { buildRoutePolyline } from "../utils/helpers";

function getMapsModule() {
  try {
    return require("react-native-maps");
  } catch (error) {
    console.warn("Map module unavailable:", error?.message || error);
    return null;
  }
}

export default function MapScreen({
  currentLocation,
  stops = [],
  locationHistory = [],
  onMapReady,
}) {
  const mapRef = useRef(null);
  const mapsModule = useMemo(() => getMapsModule(), []);
  const MapView = mapsModule?.default || null;
  const Marker = mapsModule?.Marker || null;
  const Polyline = mapsModule?.Polyline || null;
  const Circle = mapsModule?.Circle || null;
  const AnimatedRegion = mapsModule?.AnimatedRegion || null;

  const initialRegion = useMemo(() => {
    const fallback = currentLocation ||
      stops[0] || { latitude: 16.705, longitude: 74.2433 };
    return {
      latitude: Number(fallback.latitude),
      longitude: Number(fallback.longitude),
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    };
  }, [currentLocation, stops]);

  const animatedCoordinateRef = useRef(null);
  if (!animatedCoordinateRef.current && AnimatedRegion) {
    animatedCoordinateRef.current = new AnimatedRegion({
      latitude: Number(currentLocation?.latitude || initialRegion.latitude),
      longitude: Number(currentLocation?.longitude || initialRegion.longitude),
      latitudeDelta: 0,
      longitudeDelta: 0,
    });
  }
  const animatedCoordinate = animatedCoordinateRef.current;

  const routePolyline = useMemo(
    () => buildRoutePolyline(stops, locationHistory, currentLocation),
    [stops, locationHistory, currentLocation],
  );

  useEffect(() => {
    if (mapRef.current && currentLocation) {
      mapRef.current.animateCamera({
        center: {
          latitude: Number(currentLocation.latitude),
          longitude: Number(currentLocation.longitude),
        },
        zoom: 15,
      });
    }
  }, [currentLocation]);

  useEffect(() => {
    if (!currentLocation || !animatedCoordinate) return;

    animatedCoordinate
      .timing({
        latitude: Number(currentLocation.latitude),
        longitude: Number(currentLocation.longitude),
        duration: 700,
        useNativeDriver: false,
      })
      .start();
  }, [animatedCoordinate, currentLocation]);

  if (!MapView || !Marker) {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webFallbackText}>
          Live map is temporarily unavailable on this device.
        </Text>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webFallbackText}>Map loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        provider={
          Platform.OS === "android" || Platform.OS === "ios"
            ? undefined
            : undefined
        }
        onMapReady={onMapReady}
      >
        {Polyline && routePolyline.length > 1 ? (
          <Polyline
            coordinates={routePolyline}
            strokeColor="#2563EB"
            strokeWidth={4}
          />
        ) : null}

        {stops.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: Number(stop.latitude),
              longitude: Number(stop.longitude),
            }}
            title={stop.name}
            description={
              stop.completed
                ? "Completed"
                : stop.isCurrent
                  ? "Current stop"
                  : "Upcoming stop"
            }
            pinColor={
              stop.completed
                ? "#16A34A"
                : stop.isCurrent
                  ? "#F59E0B"
                  : "#7C3AED"
            }
          />
        ))}

        {currentLocation ? (
          <>
            {Marker.Animated && animatedCoordinate ? (
              <Marker.Animated
                coordinate={animatedCoordinate}
                title="Bus"
                description="Live location"
                pinColor="#111827"
              />
            ) : (
              <Marker
                coordinate={{
                  latitude: Number(currentLocation.latitude),
                  longitude: Number(currentLocation.longitude),
                }}
                title="Bus"
                description="Live location"
                pinColor="#111827"
              />
            )}
            {Circle ? (
              <Circle
                center={{
                  latitude: Number(currentLocation.latitude),
                  longitude: Number(currentLocation.longitude),
                }}
                radius={Math.max(Number(currentLocation.accuracy || 20), 20)}
                strokeColor="rgba(37,99,235,0.2)"
                fillColor="rgba(37,99,235,0.08)"
              />
            ) : null}
          </>
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 22,
  },
  map: {
    flex: 1,
    minHeight: 320,
  },
  webFallback: {
    flex: 1,
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  webFallbackText: {
    color: "#111827",
    fontWeight: "700",
  },
});
