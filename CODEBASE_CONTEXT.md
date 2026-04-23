# Bus Tracking App Context

## What This App Is

This is an Expo React Native smart bus tracking app with:

- Driver and student roles
- Local login/signup flow
- Driver dashboard
- Student dashboard
- Live map UI
- GPS location tracking
- Firebase support for shared driver codes and real-time tracking

The repo currently contains a working local-first app plus Firebase-based real-time extensions.

## Current High-Level Architecture

- `App.js` wraps the app in `GestureHandlerRootView`, `SafeAreaProvider`, and `AppProvider`
- `navigation/AppNavigator.js` chooses between launch/auth and the two dashboards
- `storage/AppStore.js` is the main state container for auth, trips, stops, and tracking
- `components/MapScreen.js` renders the map and live marker
- `services/locationService.js` handles GPS permissions and location watches
- `services/firebaseConfig.js` initializes Firebase
- `services/firebaseTracking.js` handles Firestore, Auth, and Realtime Database tracking logic

## Main Files To Know

- [`App.js`](D:\hackathon_projects\Bus_Tracking_app\App.js)
- [`navigation/AppNavigator.js`](D:\hackathon_projects\Bus_Tracking_app\navigation\AppNavigator.js)
- [`storage/AppStore.js`](D:\hackathon_projects\Bus_Tracking_app\storage\AppStore.js)
- [`screens/LaunchScreen.js`](D:\hackathon_projects\Bus_Tracking_app\screens\LaunchScreen.js)
- [`screens/AuthScreen.js`](D:\hackathon_projects\Bus_Tracking_app\screens\AuthScreen.js)
- [`screens/DriverDashboard.js`](D:\hackathon_projects\Bus_Tracking_app\screens\DriverDashboard.js)
- [`screens/StudentDashboard.js`](D:\hackathon_projects\Bus_Tracking_app\screens/StudentDashboard.js)
- [`components/MapScreen.js`](D:\hackathon_projects\Bus_Tracking_app\components\MapScreen.js)
- [`services/locationService.js`](D:\hackathon_projects\Bus_Tracking_app\services\locationService.js)
- [`services/firebaseConfig.js`](D:\hackathon_projects\Bus_Tracking_app\services\firebaseConfig.js)
- [`services/firebaseTracking.js`](D:\hackathon_projects\Bus_Tracking_app\services\firebaseTracking.js)

## What Is Working

- App launches through Expo/Metro
- Driver and student dashboard flow exists
- Local state store persists app state with `AsyncStorage`
- Driver trip creation, stops, and local map rendering still exist
- GPS tracking service is implemented with fallback simulation
- Firebase config is hardcoded and no longer depends on `.env`
- Firebase Auth, Firestore, and Realtime Database code paths are guarded
- Driver code generation exists
- Student tracking flow exists

## What Firebase Is Doing

`services/firebaseConfig.js` currently:

- Hardcodes the Firebase project config
- Initializes Firebase with `initializeApp(firebaseConfig)`
- Uses `initializeAuth(...)` with AsyncStorage persistence and falls back to `getAuth(app)`
- Initializes Firestore
- Initializes Realtime Database safely
- Loads analytics only on web

`services/firebaseTracking.js` currently:

- Generates 6-digit driver codes
- Creates/updates Firestore driver records
- Writes live bus coordinates to Realtime Database
- Lets students subscribe to a driver code and receive live location updates

## Important Data Flow

### Driver

1. Driver signs in
2. Driver creates a trip
3. App generates a 6-digit code
4. Firestore stores driver profile and code
5. When trip starts, GPS tracking begins
6. Every location update is pushed to Realtime Database at `liveLocations/{code}`

### Student

1. Student signs in
2. Student enters the 6-digit code
3. App looks up the driver in Firestore
4. Student subscribes to Realtime Database `liveLocations/{code}`
5. Map marker updates live

## Known Startup / Buffer Screen Issue

This repo had a real startup freeze / white buffer screen issue. The main problem was not just hydration. The more important blocker was that dashboard-only code was being imported too early during app boot.

### Exact Root Cause

- `navigation/AppNavigator.js` imported both `DriverDashboard` and `StudentDashboard` at module load time
- Both dashboards import `components/MapScreen.js`
- `components/MapScreen.js` previously imported `react-native-maps` at the top of the file
- That meant the map native module was evaluated before the launch screen or login screen could render
- If `react-native-maps` was slow/unavailable in Expo Go on the device, the whole app could sit on a white screen before showing Driver / Student buttons

### Secondary Boot Issue

- `navigation/AppNavigator.js` returned `LoadingScreen` while `state.hydrated` was false
- `storage/AppStore.js` originally started with `hydrated: false`
- App waited on `AsyncStorage` before first render

### Fixes Applied

- `storage/AppStore.js`
  - `initialState.hydrated` is now `true`
  - persisted state hydration runs after first render instead of blocking startup
  - Firebase is loaded through guarded helper functions instead of top-level imports
  - invalid `stopStudentTracking` action wiring was fixed

- `navigation/AppNavigator.js`
  - dashboard screens are now required lazily inside wrapper components
  - launch/login flow can render even if dashboard-only code fails later

- `components/MapScreen.js`
  - `react-native-maps` is now loaded with `require(...)` inside a safe helper
  - if the map module is unavailable, the app renders a fallback card instead of crashing or freezing
  - this keeps startup alive and prevents the map dependency from blocking launch

### Current State

- app should render launch/login immediately
- driver and student buttons should be visible again
- map failures should no longer take down the full app
- Firebase initialization is still guarded and should not block first paint

### If the white screen still appears

Check these first:

- `App.js`
- `navigation/AppNavigator.js`
- `storage/AppStore.js`
- `components/MapScreen.js`
- Metro logs for `App Mounted`
- Expo Go device logs for native map module errors

## Current Risk Areas

- `storage/AppStore.js` is large and has many effects
- There are both local and Firebase tracking flows
- Student tracking can be local or Firebase-backed depending on config
- `MapScreen` uses `react-native-maps`, which can behave differently on web vs Android
- Expo Go may still need permissions for location

## Existing UI / Flow Constraints

Important constraints that should be preserved:

- Do not redesign the UI
- Do not change navigation structure
- Do not break current driver or student screens
- Only patch startup/blocking issues or add new behavior carefully

## Recent Debug History

- Firebase was added and then hardened to avoid startup crashes
- `.env` usage was removed
- Firebase config is hardcoded
- startup render logging was added with `console.log("App Mounted")`
- hydration was moved off the critical first-render path
- `react-native-maps` was isolated so it cannot block startup
- dashboard imports were deferred so the launch screen can render independently

## How To Run

Typical commands:

- `npx expo start -c`
- If a port is busy, use another port like `npx expo start -c --port 8084`

## If Another AI Needs The Short Version

The app is an Expo React Native bus tracker with a local store in `storage/AppStore.js` and Firebase real-time tracking layered on top. The real startup blocker was eager import of dashboard modules that pulled in `react-native-maps` before the launch screen rendered. Fixes already applied: hydration no longer blocks first paint, Firebase is lazily guarded, dashboard imports are deferred in `navigation/AppNavigator.js`, and `components/MapScreen.js` now safe-loads the map library with a fallback instead of freezing the app.
