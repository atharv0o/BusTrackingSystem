import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateTrackingCode(length = 6) {
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return value;
}

export async function generateUniqueTrackingCode({
  maxAttempts = 12,
  collectionPath = 'drivers'
} = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = generateTrackingCode();
    const codeQuery = query(
      collection(db, collectionPath),
      where('activeTrip.trackingCode', '==', candidate)
    );
    const snapshot = await getDocs(codeQuery);

    if (snapshot.empty) {
      return candidate;
    }
  }

  return `${generateTrackingCode(4)}${Date.now().toString().slice(-2)}`;
}
