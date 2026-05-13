'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const { firebaseApp, firestore, auth } = useMemo(() => initializeFirebase(), []);

  // Jika firebase belum siap, kita tetap render provider namun dengan nilai null
  // Komponen di dalamnya harus menangani kondisi user/loading dengan benar
  return (
    <FirebaseProvider 
      firebaseApp={firebaseApp as any} 
      firestore={firestore as any} 
      auth={auth as any}
    >
      {children}
    </FirebaseProvider>
  );
}
