import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

function resolveDocRef(path) {
  const parts = String(path || '').split('/').filter(Boolean);
  return doc(db, ...parts);
}

export function useFirestoreDocument(path, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled && path));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !path) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      resolveDocRef(path),
      (snapshot) => {
        setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [enabled, path]);

  return { data, loading, error };
}
