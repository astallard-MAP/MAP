
'use server';

import { initializeApp, getApps, cert, App } from "firebase-admin/app";

let adminApp: App | null = null;

export async function initializeAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }
    // Returns the initialized app instance
    return initializeApp({
        projectId: 'map261125',
        storageBucket: 'map261125.firebasestorage.app'
    }); 
}
