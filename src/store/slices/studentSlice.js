import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  trackingCode: null,
  sessionId: null,
  trackedTrip: null,
  trackedDriver: null,
  loading: false,
  error: null,
  lastUpdatedAt: null
};

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setStudentLoading(state, action) {
      state.loading = Boolean(action.payload);
    },
    setStudentError(state, action) {
      state.error = action.payload || null;
      state.loading = false;
    },
    setTrackingCode(state, action) {
      state.trackingCode = action.payload || null;
    },
    setTrackedTrip(state, action) {
      const payload = action.payload || null;
      state.trackedTrip = payload;
      state.trackedDriver = payload?.driver || null;
      state.lastUpdatedAt = new Date().toISOString();
      state.loading = false;
      state.error = null;
    },
    setSessionId(state, action) {
      state.sessionId = action.payload || null;
    },
    clearTracking(state) {
      state.trackingCode = null;
      state.sessionId = null;
      state.trackedTrip = null;
      state.trackedDriver = null;
      state.error = null;
      state.loading = false;
      state.lastUpdatedAt = null;
    }
  }
});

export const {
  setStudentLoading,
  setStudentError,
  setTrackingCode,
  setTrackedTrip,
  setSessionId,
  clearTracking
} = studentSlice.actions;

export default studentSlice.reducer;
