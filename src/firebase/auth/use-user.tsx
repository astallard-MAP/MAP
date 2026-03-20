'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';

export interface UserHookResult {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isLoading: boolean;
  isProfileLoaded: boolean;
  isAuthenticated: boolean;
}

export function useUser(): UserHookResult {
  const auth = useAuth();
  const firestore = useFirestore();

  const [userState, setUserState] = useState<{
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    isProfileLoaded: boolean;
  }>({
    user: null,
    userProfile: null,
    loading: true,
    isProfileLoaded: false,
  });

  useEffect(() => {
    if (!auth) {
        setUserState({ user: null, userProfile: null, loading: false, isProfileLoaded: true });
        return;
    };

    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        if (!firestore) return;
        
        const userDocRef = doc(firestore, 'users', authUser.uid);
        
        const unsubscribeProfile = onSnapshot(userDocRef, 
          (snap) => {
            if (snap.exists()) {
              setUserState({
                user: authUser,
                userProfile: snap.data() as UserProfile,
                loading: false,
                isProfileLoaded: true,
              });
            } else {
              setUserState({ user: authUser, userProfile: null, loading: false, isProfileLoaded: true });
            }
          },
          (err) => {
            // SILENCE PERMISSION ERRORS DURING LOGOUT TRANSITIONS
            if (err.code === 'permission-denied') {
                return;
            }
            console.error("UK-EN: Error fetching production user profile", err);
            setUserState({ user: authUser, userProfile: null, loading: false, isProfileLoaded: true });
          }
        );
        
        return () => unsubscribeProfile();

      } else {
        setUserState({ user: null, userProfile: null, loading: false, isProfileLoaded: true });
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  return { 
    ...userState, 
    isLoading: userState.loading,
    isAuthenticated: !!userState.user 
  };
}
