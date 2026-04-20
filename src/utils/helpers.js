import { TRACKING_CODE_LENGTH } from './constants';

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(start, end) {
  if (!start || !end) return 0;

  const earthRadiusKm = 6371;
  const dLat = toRadians(end.latitude - start.latitude);
  const dLng = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculatePathDistanceKm(points = []) {
  if (!Array.isArray(points) || points.length < 2) return 0;

  return points.reduce((total, point, index) => {
    if (index === 0) return total;
    return total + haversineDistanceKm(points[index - 1], point);
  }, 0);
}

export function formatDuration(ms = 0) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

export function formatDateTime(value) {
  if (!value) return 'Not available';

  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

export function formatCoordinate(value, fractionDigits = 6) {
  return Number.isFinite(value) ? value.toFixed(fractionDigits) : '0.000000';
}

export function normalizeTrackingCode(value = '') {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, TRACKING_CODE_LENGTH);
}

export function generateRouteEtaMinutes(distanceKm, averageSpeedKmh = 24) {
  if (!distanceKm || !averageSpeedKmh) return null;
  return Math.max(1, Math.round((distanceKm / averageSpeedKmh) * 60));
}

export function calculateAverageSpeed(distanceKm, durationMs) {
  if (!distanceKm || !durationMs) return 0;
  const hours = durationMs / 1000 / 3600;
  if (!hours) return 0;
  return distanceKm / hours;
}

export function estimateArrivalTime(distanceKm, averageSpeedKmh = 24) {
  const minutes = generateRouteEtaMinutes(distanceKm, averageSpeedKmh);
  if (!minutes) return null;

  return new Date(Date.now() + minutes * 60 * 1000);
}

export function buildStopsStatus(stops = [], completedIds = [], currentLocation = null) {
  const normalizedStops = Array.isArray(stops) ? [...stops].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];
  const completedSet = new Set(completedIds);

  const decorated = normalizedStops.map((stop, index) => {
    const isCompleted = completedSet.has(stop.id) || Boolean(stop.completed);
    const isCurrent = !isCompleted && index === normalizedStops.findIndex((candidate) => !(completedSet.has(candidate.id) || candidate.completed));
    const nextIndex = normalizedStops.findIndex((candidate) => !(completedSet.has(candidate.id) || candidate.completed));
    const distanceKm = currentLocation && stop.latitude && stop.longitude
      ? haversineDistanceKm(currentLocation, { latitude: Number(stop.latitude), longitude: Number(stop.longitude) })
      : null;

    return {
      ...stop,
      isCompleted,
      isCurrent,
      isUpcoming: !isCompleted && index > nextIndex,
      distanceKm
    };
  });

  const currentStop = decorated.find((stop) => stop.isCurrent) || null;
  const nextStop = decorated.find((stop) => !stop.isCompleted) || null;
  const completedCount = decorated.filter((stop) => stop.isCompleted).length;

  return {
    decoratedStops: decorated,
    currentStop,
    nextStop,
    completedCount,
    totalCount: decorated.length
  };
}

export function getRouteEfficiency({ plannedDistanceKm, actualDistanceKm }) {
  if (!plannedDistanceKm) return 0;
  const raw = (actualDistanceKm / plannedDistanceKm) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function toGeoPoint(value) {
  if (!value) return null;
  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}

export function buildBoundingRegion(points = []) {
  const coords = points.filter(Boolean);
  if (!coords.length) return null;

  const latitudes = coords.map((point) => point.latitude);
  const longitudes = coords.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.5 || 0.01),
    longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.5 || 0.01)
  };
}

export function safeParseJSON(value, fallback = null) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
