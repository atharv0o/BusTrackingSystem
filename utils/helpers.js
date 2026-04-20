export function createId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function generateJoinCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }
  return value;
}

export function normalizeText(value = '') {
  return String(value ?? '').trim();
}

export function formatDuration(ms = 0) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatClockTime(timestamp) {
  if (!timestamp) return '--:--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

export function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function haversineDistanceKm(start, end) {
  if (!start || !end) return 0;

  const earthRadiusKm = 6371;
  const dLat = toRadians(toNumber(end.latitude) - toNumber(start.latitude));
  const dLng = toRadians(toNumber(end.longitude) - toNumber(start.longitude));
  const lat1 = toRadians(toNumber(start.latitude));
  const lat2 = toRadians(toNumber(end.latitude));

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculatePathDistanceKm(points = []) {
  if (!Array.isArray(points) || points.length < 2) return 0;

  return points.reduce((total, point, index) => {
    if (index === 0) return total;
    return total + haversineDistanceKm(points[index - 1], point);
  }, 0);
}

export function formatKm(value = 0) {
  return `${Number(value || 0).toFixed(2)} km`;
}

export function calculateETA(distanceKm, averageSpeedKmh = 24) {
  const safeDistance = Number(distanceKm);
  const safeSpeed = Number(averageSpeedKmh);
  if (!Number.isFinite(safeDistance) || !Number.isFinite(safeSpeed) || safeDistance <= 0 || safeSpeed <= 0) {
    return null;
  }

  return Math.max(1, Math.round((safeDistance / safeSpeed) * 60));
}

export function sortStops(stops = []) {
  return [...stops].sort((a, b) => toNumber(a.order) - toNumber(b.order));
}

export function sanitizeCoordinate(point = null) {
  if (!point) return null;
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(Number(point.accuracy)) ? Number(point.accuracy) : null,
    timestamp: point.timestamp || Date.now(),
    simulated: Boolean(point.simulated)
  };
}

export function buildRoutePolyline(stops = [], locationHistory = [], currentLocation = null) {
  const historyPoints = (locationHistory || [])
    .map(sanitizeCoordinate)
    .filter(Boolean);

  if (historyPoints.length > 1) {
    const withCurrent = currentLocation ? [...historyPoints, sanitizeCoordinate(currentLocation)].filter(Boolean) : historyPoints;
    return withCurrent.filter((point, index, array) => {
      if (index === 0) return true;
      const prev = array[index - 1];
      return prev.latitude !== point.latitude || prev.longitude !== point.longitude;
    });
  }

  const stopPoints = sortStops(stops)
    .map((stop) => sanitizeCoordinate(stop))
    .filter(Boolean);

  const path = stopPoints.length > 1 ? stopPoints : [];
  if (currentLocation) {
    const livePoint = sanitizeCoordinate(currentLocation);
    if (livePoint) {
      path.push(livePoint);
    }
  }

  return path.filter((point, index, array) => {
    if (index === 0) return true;
    const prev = array[index - 1];
    return prev.latitude !== point.latitude || prev.longitude !== point.longitude;
  });
}

export function buildSummary(trip = {}) {
  const routePoints = sortStops(trip.stops || [])
    .map((stop) => sanitizeCoordinate(stop))
    .filter(Boolean);

  const historyPoints = (trip.locationHistory || [])
    .map(sanitizeCoordinate)
    .filter(Boolean);

  const traveledDistanceKm = calculatePathDistanceKm(historyPoints.length > 1 ? historyPoints : routePoints);
  const plannedRouteDistanceKm = calculatePathDistanceKm(routePoints);
  const activeDurationMs = trip.startedAt
    ? Math.max(0, (trip.endedAt || Date.now()) - trip.startedAt - Number(trip.pausedDurationMs || 0))
    : 0;
  const averageSpeed = activeDurationMs ? traveledDistanceKm / (activeDurationMs / 1000 / 3600) : 0;
  const completedStops = (trip.stops || []).filter((stop) => Boolean(stop.completed)).length;
  const totalStops = (trip.stops || []).length;
  const routeEfficiency = plannedRouteDistanceKm
    ? Math.min(100, Math.round((traveledDistanceKm / plannedRouteDistanceKm) * 100))
    : totalStops
      ? Math.min(100, Math.round((completedStops / totalStops) * 100))
      : traveledDistanceKm
        ? 100
        : 0;

  return {
    totalDistanceKm: traveledDistanceKm,
    plannedRouteDistanceKm,
    durationMs: activeDurationMs,
    averageSpeed,
    completedStops,
    totalStops,
    routeEfficiency
  };
}

export function findCurrentAndNextStops(stops = [], currentLocation = null) {
  const orderedStops = sortStops(stops);
  const completedSet = new Set(orderedStops.filter((stop) => stop.completed).map((stop) => stop.id));
  const currentIndex = orderedStops.findIndex((stop) => !completedSet.has(stop.id));
  const currentStop = currentIndex >= 0 ? orderedStops[currentIndex] : null;
  const nextStop = currentIndex >= 0 ? orderedStops[currentIndex + 1] || null : null;

  const decoratedStops = orderedStops.map((stop, index) => {
    const isCompleted = completedSet.has(stop.id);
    const isCurrent = index === currentIndex;
    const isUpcoming = index > currentIndex;
    const distanceKm = currentLocation
      ? haversineDistanceKm(currentLocation, {
          latitude: toNumber(stop.latitude),
          longitude: toNumber(stop.longitude)
        })
      : null;

    return {
      ...stop,
      latitude: toNumber(stop.latitude),
      longitude: toNumber(stop.longitude),
      order: toNumber(stop.order, index + 1),
      completed: isCompleted,
      isCompleted,
      isCurrent,
      isUpcoming,
      distanceKm
    };
  });

  return {
    decoratedStops,
    currentStop,
    nextStop
  };
}

export function isJoinCode(value = '') {
  return /^[A-Z0-9]{6}$/.test(String(value || '').trim().toUpperCase());
}
