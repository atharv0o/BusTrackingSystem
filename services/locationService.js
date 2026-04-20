import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { DEFAULT_REGION } from '../utils/constants';

function buildJitter(seed, step) {
  return Math.sin(seed + step) * 0.00045;
}

function emitSimulation({ onLocation, tripStops = [], seedLocation = null, intervalMs = 5000 }) {
  const safeStops = tripStops
    .filter((stop) => Number.isFinite(Number(stop.latitude)) && Number.isFinite(Number(stop.longitude)))
    .map((stop) => ({
      latitude: Number(stop.latitude),
      longitude: Number(stop.longitude)
    }));

  const anchor = seedLocation || safeStops[0] || {
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
    accuracy: 25
  };

  if (safeStops.length > 1) {
    let index = 0;
    let progress = 0;

    const timer = setInterval(() => {
      const current = safeStops[index];
      const next = safeStops[(index + 1) % safeStops.length];
      progress += 0.12;

      if (progress >= 1) {
        progress = 0;
        index = (index + 1) % safeStops.length;
      }

      onLocation?.({
        latitude: current.latitude + (next.latitude - current.latitude) * progress,
        longitude: current.longitude + (next.longitude - current.longitude) * progress,
        accuracy: 20,
        timestamp: Date.now(),
        simulated: true
      });
    }, intervalMs);

    onLocation?.({
      ...safeStops[0],
      accuracy: 20,
      timestamp: Date.now(),
      simulated: true
    });

    return () => clearInterval(timer);
  }

  const timer = setInterval(() => {
    const step = Date.now() / intervalMs;
    onLocation?.({
      latitude: anchor.latitude + buildJitter(anchor.latitude, step),
      longitude: anchor.longitude + buildJitter(anchor.longitude, step / 1.6),
      accuracy: anchor.accuracy || 25,
      timestamp: Date.now(),
      simulated: true
    });
  }, intervalMs);

  onLocation?.({
    latitude: anchor.latitude,
    longitude: anchor.longitude,
    accuracy: anchor.accuracy || 25,
    timestamp: Date.now(),
    simulated: true
  });

  return () => clearInterval(timer);
}

export async function requestForegroundLocationPermission() {
  if (Platform.OS === 'web') {
    if (navigator?.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          return 'denied';
        }
      } catch {
        // Browser permission APIs vary.
      }
    }
    return 'granted';
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  return status;
}

export async function getCurrentLocation() {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      if (!navigator?.geolocation) {
        reject(new Error('Geolocation is not supported on this browser.'));
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

export async function startLocationTracking({
  onLocation,
  onError,
  tripStops = [],
  seedLocation = null,
  intervalMs = 5000
}) {
  const permission = await requestForegroundLocationPermission();

  if (permission !== 'granted') {
    return emitSimulation({ onLocation, tripStops, seedLocation, intervalMs });
  }

  if (Platform.OS === 'web') {
    if (!navigator?.geolocation) {
      onError?.(new Error('Geolocation is not available in this browser.'));
      return emitSimulation({ onLocation, tripStops, seedLocation, intervalMs });
    }

    let fallbackCleanup = null;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        onLocation?.({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || null,
          timestamp: Date.now(),
          simulated: false
        });
      },
      (error) => {
        onError?.(error);
        if (!fallbackCleanup) {
          fallbackCleanup = emitSimulation({ onLocation, tripStops, seedLocation, intervalMs });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      if (fallbackCleanup) fallbackCleanup();
      navigator.geolocation.clearWatch(watchId);
    };
  }

  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: intervalMs,
        distanceInterval: 1
      },
      (position) => {
        onLocation?.({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || null,
          timestamp: Date.now(),
          simulated: false
        });
      }
    );

    return () => subscription.remove();
  } catch (error) {
    onError?.(error);
    return emitSimulation({ onLocation, tripStops, seedLocation, intervalMs });
  }
}
