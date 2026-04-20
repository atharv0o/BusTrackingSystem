import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  profile: null,
  role: null,
  hydrated: false,
  loading: true,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateAuth(state, action) {
      const payload = action.payload || {};
      state.user = payload.user || null;
      state.profile = payload.profile || null;
      state.role = payload.role || null;
      state.hydrated = true;
      state.loading = false;
      state.error = null;
    },
    setAuthLoading(state, action) {
      state.loading = Boolean(action.payload);
    },
    setAuthError(state, action) {
      state.error = action.payload || 'Something went wrong.';
      state.loading = false;
    },
    setAuthState(state, action) {
      const payload = action.payload || {};
      state.user = payload.user || null;
      state.profile = payload.profile || null;
      state.role = payload.role || null;
      state.loading = false;
      state.error = null;
    },
    updateRole(state, action) {
      state.role = action.payload || null;
      if (state.profile) {
        state.profile.role = action.payload || null;
      }
    },
    updateProfile(state, action) {
      state.profile = {
        ...(state.profile || {}),
        ...(action.payload || {})
      };
    },
    signOutSuccess(state) {
      state.user = null;
      state.profile = null;
      state.role = null;
      state.loading = false;
      state.error = null;
    }
  }
});

export const {
  hydrateAuth,
  setAuthLoading,
  setAuthError,
  setAuthState,
  updateRole,
  updateProfile,
  signOutSuccess
} = authSlice.actions;

export default authSlice.reducer;
