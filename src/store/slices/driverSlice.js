import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentTrip: null,
  trips: [],
  route: null,
  location: null,
  status: 'Idle',
  delay: {
    isDelayed: false,
    reason: ''
  },
  isLocationConnected: false,
  loading: false,
  error: null,
  summary: null
};

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    setDriverLoading(state, action) {
      state.loading = Boolean(action.payload);
    },
    setDriverError(state, action) {
      state.error = action.payload || null;
      state.loading = false;
    },
    setCurrentTrip(state, action) {
      state.currentTrip = action.payload || null;
      state.status = action.payload?.tripData?.status || 'Idle';
      state.error = null;
    },
    setDriverTrips(state, action) {
      state.trips = Array.isArray(action.payload) ? action.payload : [];
    },
    setDriverRoute(state, action) {
      state.route = action.payload || null;
    },
    setCurrentLocation(state, action) {
      state.location = action.payload || null;
      state.isLocationConnected = Boolean(action.payload);
    },
    setConnectionStatus(state, action) {
      state.isLocationConnected = Boolean(action.payload);
    },
    setTripStatus(state, action) {
      state.status = action.payload || 'Idle';
      if (state.currentTrip) {
        state.currentTrip.tripData = {
          ...(state.currentTrip.tripData || {}),
          status: action.payload || 'Idle'
        };
      }
    },
    setDelayState(state, action) {
      state.delay = {
        isDelayed: Boolean(action.payload?.isDelayed),
        reason: action.payload?.reason || ''
      };
    },
    setTripSummary(state, action) {
      state.summary = action.payload || null;
    },
    resetDriverState() {
      return initialState;
    }
  }
});

export const {
  setDriverLoading,
  setDriverError,
  setCurrentTrip,
  setDriverTrips,
  setDriverRoute,
  setCurrentLocation,
  setConnectionStatus,
  setTripStatus,
  setDelayState,
  setTripSummary,
  resetDriverState
} = driverSlice.actions;

export default driverSlice.reducer;
