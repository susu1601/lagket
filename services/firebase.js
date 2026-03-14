// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// const firebaseConfig = {
//     apiKey: "AIzaSyBIzlLnulTQCMTjqa-s9wSjE4tzNu_S_fU",
//     authDomain: "appp-92bd1.firebaseapp.com",
//     projectId: "appp-92bd1",
//     storageBucket: "appp-92bd1.firebasestorage.app",
//     messagingSenderId: "266853425631",
//     appId: "1:266853425631:web:a3704a3e75da244b5f646a",
//     measurementId: "G-6C8JD2PEJZ"
//   };

// const firebaseConfig = {
//   apiKey: "AIzaSyBWpDVERFKlEPZyVp4RGGFBZG2csyAOdLE",
//   authDomain: "we-share-43b11.firebaseapp.com",
//   projectId: "we-share-43b11",
//   storageBucket: "we-share-43b11.firebasestorage.app",
//   messagingSenderId: "71205270137",
//   appId: "1:71205270137:web:ceca9343f90197e77f9aa8"
// };

const firebaseConfig = {
  apiKey: "AIzaSyACPsnfB9D9EGwzsij1dVUmfxhMDZiFtvg",
  authDomain: "weshare-7b3b9.firebaseapp.com",
  projectId: "weshare-7b3b9",
  storageBucket: "weshare-7b3b9.firebasestorage.app",
  messagingSenderId: "656343949905",
  appId: "1:656343949905:web:f8e399f6e91ac673610e70",
  measurementId: "G-BL69HMC0KW"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Optimize Firestore for React Native - disable real-time listeners
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
    cacheSizeBytes: 50000000, // 50MB cache
    experimentalAutoDetectLongPolling: false,
    ignoreUndefinedProperties: true
  });
} catch {
  db = getFirestore(app);
}

export { db };
export const storage = getStorage(app);

export default app;
