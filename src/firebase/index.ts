
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
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined" || firebaseConfig.apiKey === "") {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    let firestore: Firestore | null = null;
    let auth: Auth | null = null;

    try {
      firestore = getFirestore(firebaseApp);
    } catch (e) {
      console.error("Gagal inisialisasi Firestore:", e);
    }

    try {
      auth = getAuth(firebaseApp);
    } catch (e) {
      console.error("Gagal inisialisasi Auth:", e);
    }

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error("Gagal inisialisasi Firebase App:", error);
    return { firebaseApp: null, firestore: null, auth: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';
