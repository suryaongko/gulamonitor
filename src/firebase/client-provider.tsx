
'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

/**
 * Provider ini memastikan Firebase hanya diinisialisasi di sisi klien (browser).
 * Hal ini mencegah error "client-side exception" atau "hydration mismatch"
 * yang sering terjadi jika Firebase diakses selama proses pre-rendering server.
 */
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<{
    firebaseApp: any;
    firestore: any;
    auth: any;
  }>({
    firebaseApp: null,
    firestore: null,
    auth: null,
  });

  useEffect(() => {
    // Jalankan inisialisasi hanya sekali setelah komponen terpasang di browser
    const initializedServices = initializeFirebase();
    setServices(initializedServices);
  }, []);

  return (
    <FirebaseProvider 
      firebaseApp={services.firebaseApp} 
      firestore={services.firestore} 
      auth={services.auth}
    >
      {children}
    </FirebaseProvider>
  );
}
