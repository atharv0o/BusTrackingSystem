export const COLORS = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceAlt: '#F3F4F6',
  text: '#1A1A1A',
  mutedText: '#6B7280',
  border: '#E5E7EB',
  accent: '#0F172A',
  accentSoft: '#334155',
  primary: '#2563EB',
  success: '#16A34A',
  warning: '#EAB308',
  danger: '#DC2626',
  info: '#0EA5E9',
  purple: '#7C3AED',
  grid: '#F0F0F0'
};

export const STORAGE_KEYS = {
  auth: '@bus-tracking/auth',
  student: '@bus-tracking/student',
  driver: '@bus-tracking/driver',
  routesCache: '@bus-tracking/routes-cache'
};

export const TRIP_STATUS = {
  idle: 'Idle',
  inProgress: 'In Progress',
  paused: 'Paused',
  completed: 'Completed'
};

export const ROLE_TYPES = {
  driver: 'driver',
  student: 'student'
};

export const LOCATION_TRACKING_INTERVAL_MS = 5000;
export const ETA_REFRESH_INTERVAL_MS = 10000;
export const STOP_PROXIMITY_METERS = 50;
export const BUS_RADIUS_METERS = 500;
export const DEFAULT_MAP_DELTA = 0.012;
export const TRACKING_CODE_LENGTH = 6;

export const FONT_FAMILY = {
  ios: 'System',
  android: 'Roboto',
  web: 'Inter, system-ui, sans-serif'
};
