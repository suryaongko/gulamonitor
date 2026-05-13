
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
  // Pastikan kita berada di lingkungan browser
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  // Validasi kunci API dasar
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined" || firebaseConfig.apiKey === "") {
    console.warn("Konfigurasi Firebase belum lengkap. Silakan atur Environment Variables.");
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Inisialisasi layanan dengan pengamanan ekstra karena API Key yang salah 
    // tetap bisa membuat initializeApp berhasil namun getAuth/getFirestore gagal.
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
