import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import driverReducer from './slices/driverSlice';
import studentReducer from './slices/studentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    driver: driverReducer,
    student: studentReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});
