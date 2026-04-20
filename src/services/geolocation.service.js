import { Platform } from 'react-native';
import * as Location from 'expo-location';

export async function requestLocationPermission() {
  if (Platform.OS === 'web' && navigator?.permissions) {
    return 'granted';
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  return status;
}

export async function getCurrentPosition() {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      if (!navigator?.geolocation) {
        reject(new Error('Geolocation is not supported on this device.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || null
          });
        },
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000
        }
      );
    });
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy || null
  };
}

export function startLocationWatch({ onLocation, onError, intervalMs = 5000 }) {
  let subscription = null;
  let webTimer = null;
  let lastSentAt = 0;

  const emitLocation = (payload) => {
    const now = Date.now();
    if (now - lastSentAt < intervalMs - 250) return;
    lastSentAt = now;
    onLocation?.(payload);
  };

  if (Platform.OS === 'web') {
    if (!navigator?.geolocation) {
      onError?.(new Error('Geolocation is not supported in this browser.'));
      return () => {};
    }

    webTimer = navigator.geolocation.watchPosition(
      (position) => {
        emitLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || null
        });
      },
      (error) => onError?.(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      if (webTimer !== null) {
        navigator.geolocation.clearWatch(webTimer);
      }
    };
  }

  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Highest,
      distanceInterval: 1,
      timeInterval: intervalMs
    },
    (position) => {
      emitLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || null
      });
    }
  )
    .then((watch) => {
      subscription = watch;
    })
    .catch((error) => onError?.(error));

  return () => {
    subscription?.remove?.();
  };
}
