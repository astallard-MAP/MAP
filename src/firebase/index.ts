'use client';

import { firebaseConfig } from "../firebase/config";
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Initializes Firebase using the definitive production configuration.
 * Locked to production services only to avoid workstation connection errors.
 */
export function initializeFirebase() {
  const existingApps = getApps();
  const firebaseApp = existingApps.length ? existingApps[0] : initializeApp(firebaseConfig);
  
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

// Global Barrel Exports
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './storage';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
