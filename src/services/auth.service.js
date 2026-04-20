import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

export async function signUpWithEmail({ email, password, role, profile = {} }) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid = credential.user.uid;

  await setDoc(doc(db, 'users', uid), {
    uid,
    email: email.trim(),
    role,
    profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  if (role === 'driver') {
    await setDoc(doc(db, 'drivers', uid), {
      profile: {
        name: profile.name || '',
        email: email.trim(),
        phone: profile.phone || '',
        busNumber: profile.busNumber || ''
      },
      activeTripId: null,
      activeTrip: null,
      updatedAt: serverTimestamp()
    });
  }

  return credential.user;
}

export async function signInWithEmail({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function observeAuthSession(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function loadUserProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function upsertUserProfile(uid, payload) {
  await setDoc(
    doc(db, 'users', uid),
    {
      ...payload,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function updateRoleAndProfile(uid, role, profile = {}) {
  await upsertUserProfile(uid, {
    uid,
    role,
    profile
  });

  if (role === 'driver') {
    await setDoc(
      doc(db, 'drivers', uid),
      {
        profile,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }
}

export async function updateDriverBusNumber(uid, busNumber) {
  await updateDoc(doc(db, 'drivers', uid), {
    'profile.busNumber': busNumber,
    updatedAt: serverTimestamp()
  });
}
