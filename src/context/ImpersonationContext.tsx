"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { UserProfile } from "../lib/types";

type Role = UserProfile['role'];

interface ImpersonationContextType {
  impersonatedRole: Role | null;
  setImpersonatedRole: (role: Role | null) => void;
  isImpersonating: boolean;
  stopImpersonating: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedRole, setImpersonatedRole] = useState<Role | null>(null);

  const stopImpersonating = useCallback(() => {
    setImpersonatedRole(null);
  }, []);

  const contextValue = useMemo(() => ({
    impersonatedRole,
    setImpersonatedRole,
    isImpersonating: impersonatedRole !== null,
    stopImpersonating,
  }), [impersonatedRole, stopImpersonating]);

  return (
    <ImpersonationContext.Provider value={contextValue}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
