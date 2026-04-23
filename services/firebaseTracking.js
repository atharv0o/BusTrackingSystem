import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { onValue, ref, set } from "firebase/database";
import { auth, db, rtdb, isFirebaseConfigured } from "./firebaseConfig";
import { normalizeText } from "../utils/helpers";

function normalizeCode(code) {
  return normalizeText(code).toUpperCase();
}

function randomDigit() {
  return String(Math.floor(Math.random() * 10));
}

export function generateDriverCode(length = 6) {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += randomDigit();
  }
  return value;
}

export async function createUniqueDriverCode(maxAttempts = 24) {
  if (!isFirebaseConfigured() || !db) {
    return generateDriverCode();
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = generateDriverCode();
    const snapshot = await getDocs(
      query(
        collection(db, "drivers"),
        where("code", "==", candidate),
        limit(1),
      ),
    );

    if (snapshot.empty) {
      return candidate;
    }
  }

  return `${generateDriverCode(4)}${Date.now().toString().slice(-2)}`;
}

export async function upsertDriverRecord(driverId, payload = {}) {
  if (!isFirebaseConfigured() || !db || !driverId) return null;

  await setDoc(
    doc(db, "drivers", driverId),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return true;
}

export async function createOrRefreshDriverRecord({
  driverId,
  name,
  busNumber,
  routeNumber,
  code,
  active = false,
  tripStatus = "Idle",
  tripId = null,
}) {
  return upsertDriverRecord(driverId, {
    name: normalizeText(name),
    busNumber: normalizeText(busNumber).toUpperCase(),
    routeNumber: normalizeText(routeNumber),
    code: normalizeCode(code),
    active: Boolean(active),
    tripStatus,
    tripId: tripId || null,
  });
}

export async function setDriverActiveState(driverId, active, extra = {}) {
  const payload = {
    active: Boolean(active),
  };

  if (extra.tripStatus) payload.tripStatus = extra.tripStatus;
  if (extra.tripId) payload.tripId = extra.tripId;
  if (extra.startedAt) payload.startedAt = extra.startedAt;
  if (extra.endedAt) payload.endedAt = extra.endedAt;

  return upsertDriverRecord(driverId, payload);
}

export async function pushLiveDriverLocation({ code, location }) {
  if (!isFirebaseConfigured() || !rtdb) return null;

  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;

  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  await set(ref(rtdb, `liveLocations/${normalizedCode}`), {
    latitude,
    longitude,
    timestamp: Number(location?.timestamp) || Date.now(),
    accuracy: Number.isFinite(Number(location?.accuracy))
      ? Number(location.accuracy)
      : null,
  });

  return true;
}

export async function findDriverByCode(code) {
  if (!isFirebaseConfigured() || !db) return null;

  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;

  const snapshot = await getDocs(
    query(
      collection(db, "drivers"),
      where("code", "==", normalizedCode),
      limit(1),
    ),
  );

  if (snapshot.empty) return null;

  const driverDoc = snapshot.docs[0];
  return {
    id: driverDoc.id,
    ...driverDoc.data(),
  };
}

export function observeDriverTracking({ code, onDriver, onLocation, onError }) {
  if (!isFirebaseConfigured() || !db || !rtdb) {
    onError?.(new Error("Firebase is not configured."));
    return () => {};
  }

  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    onError?.(new Error("Tracking code is required."));
    return () => {};
  }

  let driverUnsubscribe = null;
  let locationUnsubscribe = null;
  let stopped = false;

  findDriverByCode(normalizedCode)
    .then((driver) => {
      if (stopped) return;

      if (!driver) {
        onError?.(new Error("Invalid driver code."));
        return;
      }

      onDriver?.({
        id: driver.id,
        ...driver,
      });

      driverUnsubscribe = onSnapshot(
        doc(db, "drivers", driver.id),
        (snapshot) => {
          if (!snapshot.exists()) {
            onError?.(new Error("Driver profile is unavailable."));
            return;
          }

          onDriver?.({
            id: snapshot.id,
            ...snapshot.data(),
          });
        },
        (snapshotError) => onError?.(snapshotError),
      );

      locationUnsubscribe = onValue(
        ref(rtdb, `liveLocations/${normalizedCode}`),
        (snapshot) => {
          onLocation?.(snapshot.exists() ? snapshot.val() : null);
        },
        (snapshotError) => onError?.(snapshotError),
      );
    })
    .catch((error) => {
      onError?.(error);
    });

  return () => {
    stopped = true;
    driverUnsubscribe?.();
    locationUnsubscribe?.();
  };
}

export async function signUpWithFirebaseAuth({
  email,
  password,
  profile = {},
}) {
  if (!isFirebaseConfigured() || !auth) return null;

  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  const uid = credential.user.uid;

  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      email: email.trim(),
      profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return credential.user;
}

export async function signInWithFirebaseAuth({ email, password }) {
  if (!isFirebaseConfigured() || !auth) return null;
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  return credential.user;
}

export async function signOutFirebaseAuth() {
  if (!isFirebaseConfigured() || !auth) return null;
  return signOut(auth);
}

export function buildFallbackDriverCode() {
  return generateDriverCode();
}
