import { useEffect, useRef, useState } from 'react';
import { requestLocationPermission, startLocationWatch } from '../services/geolocation.service';

export function useLocation({ enabled = false, intervalMs = 5000 } = {}) {
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [permission, setPermission] = useState('undetermined');
  const [error, setError] = useState(null);
  const [tracking, setTracking] = useState(false);
  const locationRef = useRef(null);

  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    const beginTracking = async () => {
      if (!enabled) return;

      try {
        setTracking(true);
        const status = await requestLocationPermission();
        if (!mounted) return;

        setPermission(status);
        if (status !== 'granted' && status !== 'undetermined') {
          setError(new Error('Location permission is required to track a trip.'));
          setTracking(false);
          return;
        }

        unsubscribe = startLocationWatch({
          intervalMs,
          onLocation: (payload) => {
            locationRef.current = payload;
            setLocation(payload);
            setAccuracy(payload?.accuracy ?? null);
            setError(null);
          },
          onError: (err) => {
            setError(err);
            setTracking(false);
          }
        });
      } catch (err) {
        setError(err);
        setTracking(false);
      }
    };

    beginTracking();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [enabled, intervalMs]);

  return {
    location,
    accuracy,
    permission,
    error,
    tracking,
    latestLocationRef: locationRef
  };
}
