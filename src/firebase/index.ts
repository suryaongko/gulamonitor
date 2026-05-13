
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function initializeFirebase(): {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
} {
  // Validasi kunci API: Jika kosong atau bernilai string "undefined", kita anggap belum siap.
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined" || firebaseConfig.apiKey === "") {
    console.warn("Konfigurasi Firebase belum lengkap. Silakan atur Environment Variables di App Hosting.");
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    const firebaseApp =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error("Gagal inisialisasi Firebase:", error);
    return { firebaseApp: null, firestore: null, auth: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
