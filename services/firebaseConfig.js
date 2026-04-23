import "react-native-get-random-values";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD3JKQm55Pj-SHJKbEge241Tva1YvOL0gA",
  authDomain: "bustrackingsystem-6cdea.firebaseapp.com",
  projectId: "bustrackingsystem-6cdea",
  storageBucket: "bustrackingsystem-6cdea.firebasestorage.app",
  messagingSenderId: "1085122660520",
  appId: "1:1085122660520:web:cac28d560e4681bf611a9d",
  measurementId: "G-VD69QRRYRL",
  databaseURL: "https://bustrackingsystem-6cdea-default-rtdb.firebaseio.com",
};

console.log("App starting...");

const hasConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId,
);

console.log("Firebase init status:", hasConfig);

let app = null;
let auth = null;
let db = null;
let rtdb = null;
let analytics = null;

try {
  if (hasConfig) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (error) {
      console.warn("Firebase Auth fallback:", error?.message || error);
      auth = getAuth(app);
    }

    db = getFirestore(app);

    try {
      rtdb = getDatabase(app, firebaseConfig.databaseURL);
    } catch (error) {
      console.warn("Firebase RTDB fallback:", error?.message || error);
      rtdb = null;
    }

    if (Platform.OS === "web") {
      try {
        const { getAnalytics, isSupported } = require("firebase/analytics");
        if (typeof isSupported === "function") {
          isSupported()
            .then((supported) => {
              if (supported) {
                analytics = getAnalytics(app);
              }
            })
            .catch((error) => {
              console.warn(
                "Firebase Analytics unsupported:",
                error?.message || error,
              );
            });
        } else {
          analytics = getAnalytics(app);
        }
      } catch (error) {
        console.warn("Firebase Analytics fallback:", error?.message || error);
        analytics = null;
      }
    }
  }
} catch (error) {
  console.error("Firebase init failed", error);
}

export { app as firebaseApp, auth, db, rtdb, analytics };

export function isFirebaseConfigured() {
  return hasConfig && Boolean(app);
}
