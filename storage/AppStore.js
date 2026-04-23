import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  buildSummary,
  createId,
  findCurrentAndNextStops,
  haversineDistanceKm,
  isJoinCode,
  normalizeText,
  sortStops,
  toNumber,
} from "../utils/helpers";
import {
  LOCATION_HISTORY_LIMIT,
  STOP_AUTO_COMPLETE_METERS,
} from "../utils/constants";
import { STORAGE_KEYS } from "./keys";
import { startLocationTracking } from "../services/locationService";

const AppContext = createContext(null);

function getFirebaseConfigService() {
  try {
    return require("../services/firebaseConfig");
  } catch {
    return null;
  }
}

function getFirebaseTrackingService() {
  try {
    return require("../services/firebaseTracking");
  } catch {
    return null;
  }
}

function isFirebaseReady() {
  const firebaseConfigService = getFirebaseConfigService();
  return Boolean(firebaseConfigService?.isFirebaseConfigured?.());
}

const initialState = {
  hydrated: true,
  users: [],
  session: null,
  activeTrip: null,
  studentTracking: null,
  archivedTrips: [],
  lastError: null,
};

function safeSession(user) {
  if (!user) return null;
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
  };
}

function cloneStops(stops = []) {
  return sortStops(stops).map((stop, index) => ({
    id: stop.id || createId("stop"),
    name: normalizeText(stop.name),
    latitude: toNumber(stop.latitude),
    longitude: toNumber(stop.longitude),
    scheduledTime: normalizeText(stop.scheduledTime || ""),
    order: toNumber(stop.order, index + 1),
    completed: Boolean(stop.completed),
    completedAt: stop.completedAt || null,
    createdAt: stop.createdAt || Date.now(),
  }));
}

function hydrateTrip(trip) {
  if (!trip) return null;
  const nextTrip = {
    ...trip,
    driverName: normalizeText(trip.driverName || ""),
    busNumber: normalizeText(trip.busNumber || "").toUpperCase(),
    routeNumber: normalizeText(trip.routeNumber || ""),
    shiftTiming: normalizeText(trip.shiftTiming || ""),
    routeName: normalizeText(trip.routeName || ""),
    joinCode: normalizeText(trip.joinCode || "").toUpperCase(),
    status: trip.status || "Idle",
    delayed: Boolean(trip.delayed),
    delayReason: normalizeText(trip.delayReason || ""),
    startedAt: trip.startedAt || null,
    pausedAt: trip.pausedAt || null,
    pausedDurationMs: toNumber(trip.pausedDurationMs, 0),
    endedAt: trip.endedAt || null,
    currentLocation: trip.currentLocation || null,
    locationHistory: Array.isArray(trip.locationHistory)
      ? trip.locationHistory.slice(-LOCATION_HISTORY_LIMIT)
      : [],
    stops: cloneStops(trip.stops || []),
    studentTrackingEnabled: Boolean(trip.studentTrackingEnabled),
    studentTrackingCode:
      normalizeText(trip.studentTrackingCode || "").toUpperCase() || null,
    createdAt: trip.createdAt || Date.now(),
  };

  const decorated = findCurrentAndNextStops(
    nextTrip.stops,
    nextTrip.currentLocation || null,
  );
  return {
    ...nextTrip,
    stops: decorated.decoratedStops,
    currentStopId: decorated.currentStop?.id || null,
    nextStopId: decorated.nextStop?.id || null,
    summary: trip.summary || null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE": {
      const payload = action.payload || {};
      return {
        ...state,
        hydrated: true,
        users: Array.isArray(payload.users) ? payload.users : [],
        session: payload.session || null,
        activeTrip: hydrateTrip(payload.activeTrip),
        studentTracking: payload.studentTracking || null,
        archivedTrips: Array.isArray(payload.archivedTrips)
          ? payload.archivedTrips.map(hydrateTrip).filter(Boolean)
          : [],
        lastError: null,
      };
    }
    case "SET_ERROR":
      return { ...state, lastError: action.payload || null };
    case "SIGN_UP":
      return {
        ...state,
        users: [...state.users, action.payload],
        session: safeSession(action.payload),
        lastError: null,
      };
    case "SYNC_USER": {
      const nextUser = action.payload;
      if (!nextUser) return state;

      const nextUsers = [...state.users];
      const index = nextUsers.findIndex(
        (user) => user.email === nextUser.email && user.role === nextUser.role,
      );

      if (index >= 0) {
        nextUsers[index] = {
          ...nextUsers[index],
          ...nextUser,
        };
      } else {
        nextUsers.push(nextUser);
      }

      return {
        ...state,
        users: nextUsers,
        session: safeSession(nextUser),
        lastError: null,
      };
    }
    case "SIGN_IN":
      return { ...state, session: action.payload, lastError: null };
    case "SIGN_OUT":
      return { ...state, session: null, lastError: null };
    case "START_STUDENT_TRACKING":
      return {
        ...state,
        studentTracking: {
          code: action.payload?.code || null,
          driverId: action.payload?.driverId || null,
          driver: action.payload?.driver || null,
          liveLocation: action.payload?.liveLocation || null,
          active: Boolean(action.payload?.active),
          loading: Boolean(action.payload?.loading),
          source: action.payload?.source || "firebase",
          connectedAt: action.payload?.connectedAt || Date.now(),
          lastUpdatedAt: Date.now(),
          error: null,
        },
      };
    case "UPDATE_STUDENT_TRACKING":
      if (!state.studentTracking) return state;
      return {
        ...state,
        studentTracking: {
          ...state.studentTracking,
          ...(action.payload || {}),
          lastUpdatedAt: Date.now(),
        },
      };
    case "STOP_STUDENT_TRACKING":
      return {
        ...state,
        studentTracking: null,
      };
    case "CREATE_TRIP": {
      const activeTrip = hydrateTrip(action.payload);
      return {
        ...state,
        archivedTrips: state.activeTrip
          ? [hydrateTrip(state.activeTrip), ...state.archivedTrips]
              .filter(Boolean)
              .slice(0, 20)
          : state.archivedTrips,
        activeTrip,
        lastError: null,
      };
    }
    case "UPDATE_TRIP":
      return {
        ...state,
        activeTrip: state.activeTrip
          ? hydrateTrip({ ...state.activeTrip, ...action.payload })
          : state.activeTrip,
      };
    case "ADD_STOP": {
      if (!state.activeTrip) return state;
      const nextStops = cloneStops([
        ...(state.activeTrip.stops || []),
        action.payload,
      ]);
      const decorated = findCurrentAndNextStops(
        nextStops,
        state.activeTrip.currentLocation || null,
      );
      return {
        ...state,
        activeTrip: hydrateTrip({
          ...state.activeTrip,
          stops: decorated.decoratedStops,
        }),
      };
    }
    case "TOGGLE_STOP": {
      if (!state.activeTrip) return state;
      const nextStops = (state.activeTrip.stops || []).map((stop) => {
        if (stop.id !== action.payload) return stop;
        const nextCompleted = !stop.completed;
        return {
          ...stop,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : null,
        };
      });
      const decorated = findCurrentAndNextStops(
        nextStops,
        state.activeTrip.currentLocation || null,
      );
      return {
        ...state,
        activeTrip: hydrateTrip({
          ...state.activeTrip,
          stops: decorated.decoratedStops,
        }),
      };
    }
    case "SET_DELAY":
      if (!state.activeTrip) return state;
      return {
        ...state,
        activeTrip: hydrateTrip({
          ...state.activeTrip,
          delayed: Boolean(action.payload.delayed),
          delayReason: normalizeText(action.payload.reason || ""),
        }),
      };
    case "START_TRIP": {
      if (!state.activeTrip) return state;
      const now = action.payload || Date.now();
      const pausedDurationMs = toNumber(state.activeTrip.pausedDurationMs, 0);
      const extraPaused = state.activeTrip.pausedAt
        ? now - state.activeTrip.pausedAt
        : 0;
      return {
        ...state,
        activeTrip: hydrateTrip({
          ...state.activeTrip,
          status: "In Progress",
          startedAt: state.activeTrip.startedAt || now,
          pausedAt: null,
          pausedDurationMs: pausedDurationMs + Math.max(0, extraPaused),
          endedAt: null,
        }),
      };
    }
    case "PAUSE_TRIP": {
      if (!state.activeTrip) return state;
      return {
        ...state,
        activeTrip: hydrateTrip({
          ...state.activeTrip,
          status: "Paused",
          pausedAt: action.payload || Date.now(),
        }),
      };
    }
    case "END_TRIP": {
      if (!state.activeTrip) return state;
      const endedAt = action.payload?.endedAt || Date.now();
      const effectivePausedDuration =
        toNumber(state.activeTrip.pausedDurationMs, 0) +
        (state.activeTrip.pausedAt
          ? Math.max(0, endedAt - state.activeTrip.pausedAt)
          : 0);
      const completedTrip = hydrateTrip({
        ...state.activeTrip,
        status: "Completed",
        endedAt,
        pausedAt: null,
        pausedDurationMs: effectivePausedDuration,
        summary: buildSummary({
          ...state.activeTrip,
          endedAt,
          pausedDurationMs: effectivePausedDuration,
        }),
      });

      return {
        ...state,
        activeTrip: completedTrip,
        archivedTrips: [completedTrip, ...state.archivedTrips]
          .filter(Boolean)
          .slice(0, 20),
      };
    }
    case "SET_LOCATION": {
      if (!state.activeTrip || state.activeTrip.status !== "In Progress")
        return state;

      const incoming = action.payload || {};
      const nextLocation = {
        latitude: toNumber(incoming.latitude),
        longitude: toNumber(incoming.longitude),
        accuracy: Number.isFinite(Number(incoming.accuracy))
          ? Number(incoming.accuracy)
          : null,
        timestamp: incoming.timestamp || Date.now(),
        simulated: Boolean(incoming.simulated),
      };

      const nextHistory = [
        ...(state.activeTrip.locationHistory || []),
        nextLocation,
      ].slice(-LOCATION_HISTORY_LIMIT);
      const pendingStops = cloneStops(state.activeTrip.stops || []);
      const nextIncomplete = pendingStops.find((stop) => !stop.completed);

      if (nextIncomplete) {
        const distanceMeters =
          haversineDistanceKm(nextLocation, nextIncomplete) * 1000;
        if (distanceMeters <= STOP_AUTO_COMPLETE_METERS) {
          nextIncomplete.completed = true;
          nextIncomplete.completedAt = Date.now();
        }
      }

      const decorated = findCurrentAndNextStops(pendingStops, nextLocation);
      const summary = buildSummary({
        ...state.activeTrip,
        currentLocation: nextLocation,
        locationHistory: nextHistory,
        stops: decorated.decoratedStops,
      });

      return {
        ...state,
        activeTrip: hydrateTrip({
          ...state.activeTrip,
          currentLocation: nextLocation,
          locationHistory: nextHistory,
          stops: decorated.decoratedStops,
          currentStopId: decorated.currentStop?.id || null,
          nextStopId: decorated.nextStop?.id || null,
          summary,
        }),
      };
    }
    default:
      return state;
  }
}

async function loadPersistedState() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.appState);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function savePersistedState(state) {
  const payload = {
    users: state.users,
    session: state.session,
    activeTrip: state.activeTrip,
    studentTracking: state.studentTracking,
    archivedTrips: state.archivedTrips,
  };
  await AsyncStorage.setItem(STORAGE_KEYS.appState, JSON.stringify(payload));
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const watchCleanupRef = useRef(null);
  const studentWatchCleanupRef = useRef(null);

  const stopLocationTracking = useCallback(() => {
    if (watchCleanupRef.current) {
      watchCleanupRef.current();
      watchCleanupRef.current = null;
    }
  }, []);

  const stopStudentTrackingCleanup = useCallback(() => {
    if (studentWatchCleanupRef.current) {
      studentWatchCleanupRef.current();
      studentWatchCleanupRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadPersistedState()
      .then((persisted) => {
        if (!mounted) return;
        if (persisted) {
          dispatch({
            type: "HYDRATE",
            payload: persisted,
          });
        }
      })
      .catch((error) => {
        if (!mounted) return;
        dispatch({
          type: "SET_ERROR",
          payload: error?.message || "Unable to load saved state.",
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    savePersistedState(state).catch((error) => {
      dispatch({
        type: "SET_ERROR",
        payload: error?.message || "Unable to save local state.",
      });
    });
  }, [
    state.hydrated,
    state.users,
    state.session,
    state.activeTrip,
    state.studentTracking,
    state.archivedTrips,
  ]);

  useEffect(() => {
    if (!state.hydrated) return;

    if (
      !state.studentTracking?.code ||
      state.studentTracking?.source !== "firebase" ||
      !isFirebaseReady()
    ) {
      stopStudentTrackingCleanup();
      return undefined;
    }

    const firebaseTrackingService = getFirebaseTrackingService();
    if (!firebaseTrackingService?.observeDriverTracking) {
      stopStudentTrackingCleanup();
      return undefined;
    }

    let cancelled = false;

    const cleanup = firebaseTrackingService.observeDriverTracking({
      code: state.studentTracking.code,
      onDriver: (driver) => {
        dispatch({
          type: "UPDATE_STUDENT_TRACKING",
          payload: {
            driver,
            driverId: driver.id,
            active: Boolean(driver.active),
            loading: false,
            error: null,
          },
        });
      },
      onLocation: (liveLocation) => {
        dispatch({
          type: "UPDATE_STUDENT_TRACKING",
          payload: {
            liveLocation,
            loading: false,
          },
        });
      },
      onError: (error) => {
        dispatch({
          type: "SET_ERROR",
          payload: error?.message || "Unable to track driver.",
        });
        dispatch({
          type: "UPDATE_STUDENT_TRACKING",
          payload: {
            error: error?.message || "Unable to track driver.",
            loading: false,
          },
        });
      },
    });

    if (cancelled) {
      cleanup?.();
      return undefined;
    }

    studentWatchCleanupRef.current = cleanup;

    return () => {
      cancelled = true;
      stopStudentTrackingCleanup();
    };
  }, [
    state.hydrated,
    state.studentTracking?.code,
    state.studentTracking?.source,
    stopStudentTrackingCleanup,
  ]);

  useEffect(() => {
    if (!state.hydrated) return;

    const shouldTrack =
      state.session?.role === "driver" &&
      state.activeTrip &&
      state.activeTrip.status === "In Progress";

    if (!shouldTrack) {
      stopLocationTracking();
      return undefined;
    }

    let cancelled = false;

    startLocationTracking({
      onLocation: (location) => {
        const firebaseTrackingService = getFirebaseTrackingService();
        if (
          state.session?.id &&
          state.activeTrip?.joinCode &&
          firebaseTrackingService?.pushLiveDriverLocation
        ) {
          void firebaseTrackingService.pushLiveDriverLocation({
            code: state.activeTrip.joinCode,
            location,
          });
        }
        dispatch({ type: "SET_LOCATION", payload: location });
      },
      onError: (error) => {
        dispatch({
          type: "SET_ERROR",
          payload: error?.message || "Location tracking failed.",
        });
      },
      tripStops: state.activeTrip.stops || [],
      seedLocation: state.activeTrip.currentLocation || null,
      intervalMs: 5000,
    })
      .then((cleanup) => {
        if (cancelled) {
          cleanup?.();
          return;
        }
        watchCleanupRef.current = cleanup;
      })
      .catch((error) => {
        dispatch({
          type: "SET_ERROR",
          payload: error?.message || "Unable to start location tracking.",
        });
      });

    return () => {
      cancelled = true;
      stopLocationTracking();
    };
  }, [
    state.hydrated,
    state.session?.role,
    state.activeTrip?.id,
    state.activeTrip?.status,
    stopLocationTracking,
  ]);

  const actions = useMemo(() => {
    const signUp = async ({ role, fullName, email, password }) => {
      const nextEmail = normalizeText(email).toLowerCase();
      const nextPassword = normalizeText(password);
      const nextName = normalizeText(fullName);
      const nextRole = role === "student" ? "student" : "driver";

      if (!nextName || !nextEmail || !nextPassword || !nextRole) {
        throw new Error("Please complete all required fields.");
      }

      if (nextPassword.length < 4) {
        throw new Error("Password must be at least 4 characters.");
      }

      const duplicate = state.users.find(
        (user) => user.email === nextEmail && user.role === nextRole,
      );
      if (duplicate) {
        throw new Error("An account with this role and email already exists.");
      }

      const user = {
        id: createId("user"),
        role: nextRole,
        fullName: nextName,
        email: nextEmail,
        password: nextPassword,
        createdAt: Date.now(),
      };

      const firebaseTrackingService = getFirebaseTrackingService();
      if (
        isFirebaseReady() &&
        firebaseTrackingService?.signUpWithFirebaseAuth
      ) {
        try {
          const firebaseUser =
            await firebaseTrackingService.signUpWithFirebaseAuth({
              email: nextEmail,
              password: nextPassword,
              profile: {
                name: nextName,
                role: nextRole,
              },
            });

          if (firebaseUser?.uid) {
            user.id = firebaseUser.uid;
            user.firebaseUid = firebaseUser.uid;
          }
        } catch {
          // Keep the current local auth flow working even if Firebase auth is unavailable.
        }
      }

      dispatch({ type: "SYNC_USER", payload: user });
      return user;
    };

    const signIn = async ({ role, email, password }) => {
      const nextEmail = normalizeText(email).toLowerCase();
      const nextPassword = normalizeText(password);
      const nextRole = role === "student" ? "student" : "driver";

      const localUser = state.users.find(
        (candidate) =>
          candidate.role === nextRole &&
          candidate.email === nextEmail &&
          candidate.password === nextPassword,
      );

      const firebaseTrackingService = getFirebaseTrackingService();
      if (
        isFirebaseReady() &&
        firebaseTrackingService?.signInWithFirebaseAuth
      ) {
        try {
          const firebaseUser =
            await firebaseTrackingService.signInWithFirebaseAuth({
              email: nextEmail,
              password: nextPassword,
            });

          const nextUser = localUser
            ? {
                ...localUser,
                id: firebaseUser?.uid || localUser.id,
                firebaseUid: firebaseUser?.uid || localUser.firebaseUid || null,
              }
            : {
                id: firebaseUser?.uid || createId("user"),
                role: nextRole,
                fullName: firebaseUser?.displayName || nextEmail.split("@")[0],
                email: nextEmail,
                password: nextPassword,
                firebaseUid: firebaseUser?.uid || null,
                createdAt: Date.now(),
              };

          dispatch({ type: "SYNC_USER", payload: nextUser });
          return safeSession(nextUser);
        } catch {
          if (!localUser) {
            throw new Error("Invalid credentials for the selected role.");
          }
        }
      }

      if (!localUser) {
        throw new Error("Invalid credentials for the selected role.");
      }

      dispatch({ type: "SIGN_IN", payload: safeSession(localUser) });
      return safeSession(localUser);
    };

    const signOut = async () => {
      stopLocationTracking();
      stopStudentTrackingCleanup();
      const firebaseTrackingService = getFirebaseTrackingService();
      if (isFirebaseReady() && firebaseTrackingService?.signOutFirebaseAuth) {
        try {
          await firebaseTrackingService.signOutFirebaseAuth();
        } catch {
          // Local sign-out should still succeed.
        }
      }
      dispatch({ type: "SIGN_OUT" });
    };

    const createTrip = async (details) => {
      const session = state.session;
      if (!session || session.role !== "driver") {
        throw new Error("Only drivers can create trips.");
      }

      const driverName = normalizeText(details.driverName || session.fullName);
      const busNumber = normalizeText(details.busNumber).toUpperCase();
      const routeNumber = normalizeText(details.routeNumber);
      const shiftTiming = normalizeText(details.shiftTiming);
      const routeName = normalizeText(details.routeName || "");

      if (!driverName || !busNumber || !routeNumber || !shiftTiming) {
        throw new Error(
          "Driver name, bus number, route number, and shift timing are required.",
        );
      }

      if (
        state.activeTrip &&
        state.activeTrip.busNumber === busNumber &&
        state.activeTrip.status !== "Completed"
      ) {
        throw new Error("That bus is already assigned to an active trip.");
      }

      const trip = hydrateTrip({
        id: createId("trip"),
        driverId: session.id,
        driverName,
        busNumber,
        routeNumber,
        shiftTiming,
        routeName,
        status: "Idle",
        delayed: false,
        delayReason: "",
        joinCode: (() => {
          const firebaseTrackingService = getFirebaseTrackingService();
          if (
            isFirebaseReady() &&
            firebaseTrackingService?.createUniqueDriverCode
          ) {
            return null;
          }
          return "pending";
        })(),
        createdAt: Date.now(),
        startedAt: null,
        pausedAt: null,
        pausedDurationMs: 0,
        endedAt: null,
        currentLocation: null,
        locationHistory: [],
        stops: [],
        summary: null,
        studentTrackingEnabled: false,
      });

      const firebaseTrackingService = getFirebaseTrackingService();
      if (
        isFirebaseReady() &&
        firebaseTrackingService?.createUniqueDriverCode
      ) {
        trip.joinCode = await firebaseTrackingService.createUniqueDriverCode();
      } else if (firebaseTrackingService?.buildFallbackDriverCode) {
        trip.joinCode = firebaseTrackingService.buildFallbackDriverCode();
      } else {
        trip.joinCode = `${Math.floor(100000 + Math.random() * 900000)}`;
      }

      dispatch({ type: "CREATE_TRIP", payload: trip });

      if (
        isFirebaseReady() &&
        firebaseTrackingService?.createOrRefreshDriverRecord
      ) {
        await firebaseTrackingService.createOrRefreshDriverRecord({
          driverId: session.id,
          name: driverName,
          busNumber,
          routeNumber,
          code: trip.joinCode,
          active: false,
          tripStatus: "Idle",
          tripId: trip.id,
        });
      }

      return trip;
    };

    const updateTrip = async (patch) => {
      if (!state.activeTrip) throw new Error("Create a trip first.");
      dispatch({ type: "UPDATE_TRIP", payload: patch });
    };

    const addStop = async (stop) => {
      if (!state.activeTrip) throw new Error("Create a trip first.");

      const nextStop = {
        id: createId("stop"),
        name: normalizeText(stop.name),
        latitude: toNumber(stop.latitude, NaN),
        longitude: toNumber(stop.longitude, NaN),
        scheduledTime: normalizeText(stop.scheduledTime || ""),
        order: Number.isFinite(Number(stop.order))
          ? Number(stop.order)
          : state.activeTrip.stops.length + 1,
        completed: false,
        completedAt: null,
        createdAt: Date.now(),
      };

      if (
        !nextStop.name ||
        !Number.isFinite(nextStop.latitude) ||
        !Number.isFinite(nextStop.longitude)
      ) {
        throw new Error("Stop name, latitude, and longitude are required.");
      }

      dispatch({ type: "ADD_STOP", payload: nextStop });
      return nextStop;
    };

    const toggleStopComplete = async (stopId) => {
      if (!state.activeTrip) return;
      dispatch({ type: "TOGGLE_STOP", payload: stopId });
    };

    const setDelay = async ({ delayed, reason }) => {
      if (!state.activeTrip) throw new Error("No active trip.");
      dispatch({
        type: "SET_DELAY",
        payload: {
          delayed: Boolean(delayed),
          reason: delayed ? reason : "",
        },
      });
    };

    const startTrip = async () => {
      if (!state.activeTrip) throw new Error("Create a trip first.");
      dispatch({ type: "START_TRIP", payload: Date.now() });
      const firebaseTrackingService = getFirebaseTrackingService();
      if (isFirebaseReady() && firebaseTrackingService?.setDriverActiveState) {
        await firebaseTrackingService.setDriverActiveState(
          state.session.id,
          true,
          {
            tripStatus: "In Progress",
            tripId: state.activeTrip.id,
            startedAt: state.activeTrip.startedAt || Date.now(),
          },
        );
      }
    };

    const pauseTrip = async () => {
      if (!state.activeTrip) throw new Error("No active trip.");
      dispatch({ type: "PAUSE_TRIP", payload: Date.now() });
      stopLocationTracking();
      const firebaseTrackingService = getFirebaseTrackingService();
      if (isFirebaseReady() && firebaseTrackingService?.setDriverActiveState) {
        await firebaseTrackingService.setDriverActiveState(
          state.session.id,
          true,
          {
            tripStatus: "Paused",
            tripId: state.activeTrip.id,
          },
        );
      }
    };

    const endTrip = async () => {
      if (!state.activeTrip) throw new Error("No active trip.");
      dispatch({ type: "END_TRIP", payload: { endedAt: Date.now() } });
      stopLocationTracking();
      stopStudentTrackingCleanup();
      const firebaseTrackingService = getFirebaseTrackingService();
      if (isFirebaseReady() && firebaseTrackingService?.setDriverActiveState) {
        await firebaseTrackingService.setDriverActiveState(
          state.session.id,
          false,
          {
            tripStatus: "Completed",
            tripId: state.activeTrip.id,
            endedAt: Date.now(),
          },
        );
      }
    };

    const startStudentTracking = async (joinCode) => {
      const code = normalizeText(joinCode).toUpperCase();
      if (!isJoinCode(code)) {
        throw new Error("Tracking code must be 6 digits.");
      }

      const firebaseTrackingService = getFirebaseTrackingService();
      if (isFirebaseReady() && firebaseTrackingService?.findDriverByCode) {
        const driver = await firebaseTrackingService.findDriverByCode(code);
        if (!driver) {
          throw new Error("Invalid tracking code.");
        }

        dispatch({
          type: "START_STUDENT_TRACKING",
          payload: {
            code,
            driverId: driver.id,
            driver,
            liveLocation: null,
            active: Boolean(driver.active),
            loading: true,
            source: "firebase",
          },
        });

        return driver;
      }

      if (!state.activeTrip || state.activeTrip.joinCode !== code) {
        throw new Error("Invalid or inactive tracking code.");
      }

      if (state.activeTrip.status === "Completed") {
        throw new Error("Trip has already ended.");
      }

      dispatch({
        type: "START_STUDENT_TRACKING",
        payload: {
          code,
          driverId: state.activeTrip.driverId,
          driver: {
            id: state.activeTrip.driverId,
            name: state.activeTrip.driverName,
            busNumber: state.activeTrip.busNumber,
            routeNumber: state.activeTrip.routeNumber,
            active: state.activeTrip.status !== "Completed",
          },
          liveLocation: state.activeTrip.currentLocation || null,
          active: state.activeTrip.status !== "Completed",
          loading: false,
          source: "local",
        },
      });

      return state.activeTrip;
    };

    const stopStudentTrackingAction = async () => {
      stopStudentTrackingCleanup();
      dispatch({ type: "STOP_STUDENT_TRACKING" });
    };

    return {
      signUp,
      signIn,
      signOut,
      createTrip,
      updateTrip,
      addStop,
      toggleStopComplete,
      setDelay,
      startTrip,
      pauseTrip,
      endTrip,
      startStudentTracking,
      stopStudentTracking: stopStudentTrackingAction,
      stopLocationTracking,
    };
  }, [
    state.activeTrip,
    state.session,
    state.users,
    stopLocationTracking,
    stopStudentTrackingCleanup,
  ]);

  const value = useMemo(
    () => ({
      state,
      actions,
    }),
    [state, actions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used inside AppProvider.");
  }
  return context;
}
