import React, { forwardRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const MapComponent = forwardRef(function MapComponent(
  {
    style,
    region,
    initialRegion,
    onMapReady,
    onRegionChangeComplete,
    children,
    showUserLocation = false,
    followsUserLocation = false,
    loading = false,
    googleMapId = null
  },
  ref
) {
  return (
    <View style={[styles.wrapper, style]}>
      <MapView
        ref={ref}
        style={styles.map}
        provider={Platform.OS === 'android' || Platform.OS === 'ios' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        region={region}
        onMapReady={onMapReady}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={showUserLocation}
        followsUserLocation={followsUserLocation}
        googleMapId={googleMapId || undefined}
        loadingEnabled={loading}
      >
        {children}
      </MapView>
    </View>
  );
});

export { MapView, Marker, Polyline, Circle };
export default MapComponent;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden'
  },
  map: {
    flex: 1
  }
});
