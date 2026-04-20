import {
  addDoc,
  arrayUnion,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { generateUniqueTrackingCode } from './codeGenerator.service';

export async function isBusNumberUnique(busNumber, currentDriverId = null) {
  const normalized = String(busNumber || '').trim().toUpperCase();
  const snapshot = await getDocs(
    query(collection(db, 'drivers'), where('profile.busNumber', '==', normalized), limit(5))
  );

  return snapshot.docs.every((driverDoc) => currentDriverId && driverDoc.id === currentDriverId);
}

export async function ensureDriverDocument(driverId, profile = {}) {
  await setDoc(
    doc(db, 'drivers', driverId),
    {
      profile,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function createTrip({ driverId, tripData, routeStops = [], routeName = '' }) {
  const trackingCode = await generateUniqueTrackingCode();
  const tripRef = await addDoc(collection(db, 'drivers', driverId, 'trips'), {
    tripData: {
      ...tripData,
      startTime: null,
      endTime: null,
      status: 'Idle',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    routeStops,
    routeName,
    trackingCode,
    currentLocation: null,
    delay: {
      isDelayed: false,
      reason: '',
      timestamp: null
    },
    summary: null,
    locations: [],
    completedStopIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await updateDoc(doc(db, 'drivers', driverId), {
    activeTripId: tripRef.id,
    activeTrip: {
      tripId: tripRef.id,
      trackingCode,
      status: 'Idle',
      routeNumber: tripData.routeNumber || '',
      busNumber: tripData.busNumber || ''
    },
    updatedAt: serverTimestamp()
  });

  await setDoc(
    doc(db, 'users', driverId),
    {
      activeTripId: tripRef.id,
      activeTrip: {
        tripId: tripRef.id,
        trackingCode,
        status: 'Idle',
        routeNumber: tripData.routeNumber || '',
        busNumber: tripData.busNumber || ''
      },
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  await setDoc(doc(db, 'routes', tripData.routeNumber || tripRef.id), {
    routeName: routeName || tripData.routeNumber || 'Route',
    stops: routeStops,
    updatedAt: serverTimestamp()
  }, { merge: true });

  return {
    tripId: tripRef.id,
    trackingCode
  };
}

export function listenToDriverTrips(driverId, callback) {
  return onSnapshot(
    query(collection(db, 'drivers', driverId, 'trips'), orderBy('createdAt', 'desc'), limit(20)),
    (snapshot) => {
      callback(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    },
    (error) => callback([], error)
  );
}

export function listenToTrip(driverId, tripId, callback) {
  return onSnapshot(
    doc(db, 'drivers', driverId, 'trips', tripId),
    (snapshot) => callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    (error) => callback(null, error)
  );
}

export function listenToDriverProfile(driverId, callback) {
  return onSnapshot(doc(db, 'drivers', driverId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export function listenToRoute(routeId, callback) {
  return onSnapshot(doc(db, 'routes', routeId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export async function updateTripMetadata({ driverId, tripId, patch }) {
  await updateDoc(doc(db, 'drivers', driverId, 'trips', tripId), {
    ...patch,
    updatedAt: serverTimestamp()
  });
}

export async function setTripStatus({ driverId, tripId, status, timestampField = null }) {
  const payload = {
    'tripData.status': status,
    updatedAt: serverTimestamp()
  };

  if (timestampField) {
    payload[`tripData.${timestampField}`] = serverTimestamp();
  }

  await updateDoc(doc(db, 'drivers', driverId, 'trips', tripId), payload);
  await updateDoc(doc(db, 'drivers', driverId), {
    'activeTrip.status': status,
    updatedAt: serverTimestamp()
  });
  await updateDoc(doc(db, 'users', driverId), {
    'activeTrip.status': status,
    updatedAt: serverTimestamp()
  });
}

export async function appendTripLocation({
  driverId,
  tripId,
  location,
  accuracy = null,
  source = 'gps'
}) {
  const point = {
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
    source,
    timestamp: serverTimestamp()
  };

  const tripRef = doc(db, 'drivers', driverId, 'trips', tripId);
  const locationRef = collection(db, 'drivers', driverId, 'trips', tripId, 'locations');

  await addDoc(locationRef, point);
  await updateDoc(tripRef, {
    currentLocation: {
      latitude: point.latitude,
      longitude: point.longitude,
      accuracy: point.accuracy,
      timestamp: serverTimestamp()
    },
    locations: arrayUnion({
      latitude: point.latitude,
      longitude: point.longitude,
      accuracy: point.accuracy
    }),
    updatedAt: serverTimestamp()
  });
}

export async function updateTripStops({ driverId, tripId, stops = [] }) {
  await updateDoc(doc(db, 'drivers', driverId, 'trips', tripId), {
    routeStops: stops,
    updatedAt: serverTimestamp()
  });
}

export async function updateTripDelay({ driverId, tripId, isDelayed, reason }) {
  await updateDoc(doc(db, 'drivers', driverId, 'trips', tripId), {
    delay: {
      isDelayed: Boolean(isDelayed),
      reason: reason || '',
      timestamp: serverTimestamp()
    },
    updatedAt: serverTimestamp()
  });
}

export async function completeStop({ driverId, tripId, stopId }) {
  await updateDoc(doc(db, 'drivers', driverId, 'trips', tripId), {
    completedStopIds: arrayUnion(stopId),
    updatedAt: serverTimestamp()
  });
}

export async function finalizeTripSummary({ driverId, tripId, summary }) {
  await updateDoc(doc(db, 'drivers', driverId, 'trips', tripId), {
    summary,
    'tripData.endTime': serverTimestamp(),
    'tripData.status': 'Completed',
    updatedAt: serverTimestamp()
  });

  await updateDoc(doc(db, 'drivers', driverId), {
    activeTripId: null,
    activeTrip: null,
    updatedAt: serverTimestamp()
  });

  await setDoc(
    doc(db, 'users', driverId),
    {
      activeTripId: null,
      activeTrip: null,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveTrackingSession({ studentId, driverId, tripId, code }) {
  const sessionRef = await addDoc(collection(db, 'trackingSessions'), {
    studentId,
    driverId,
    tripId,
    code,
    startTime: serverTimestamp(),
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return sessionRef.id;
}

export async function endTrackingSession(sessionId) {
  if (!sessionId) return;

  await updateDoc(doc(db, 'trackingSessions', sessionId), {
    active: false,
    endTime: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function findActiveTripByTrackingCode(code) {
  const normalized = String(code || '').trim().toUpperCase();
  const snapshot = await getDocs(
    query(
      collectionGroup(db, 'trips'),
      where('trackingCode', '==', normalized),
      limit(20)
    )
  );

  const match = snapshot.docs
    .map((entry) => ({ id: entry.id, path: entry.ref.path, ...entry.data() }))
    .find((trip) => trip.tripData?.status !== 'Completed');

  if (!match) return null;

  const driverId = match.path.split('/')[1];
  return {
    ...match,
    driverId
  };
}

export async function loadTripByPath(driverId, tripId) {
  const snapshot = await getDoc(doc(db, 'drivers', driverId, 'trips', tripId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function saveTripSummaryLocally(driverId, tripId, summary) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'drivers', driverId, 'trips', tripId), {
    summary,
    updatedAt: serverTimestamp()
  });
  await batch.commit();
}
