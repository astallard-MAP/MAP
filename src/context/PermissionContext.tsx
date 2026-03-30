"use client";

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useImpersonation } from './ImpersonationContext';
import type { UserRole, UserProfile } from "../lib/types";
import { GLOBAL_ADMIN_UIDS } from "../lib/constants";

interface PermissionContextType {
  currentUserProfile: UserProfile | null;
  effectiveRole: UserRole | null;
  isGlobalAdmin: boolean;
  isAdmin: boolean;
  isTadManager: boolean;
  isRegionalManager: boolean;
  isAreaManager: boolean;
  isSalesManager: boolean;
  isAgencyOwner: boolean;
  isAgencyRegionalManager: boolean;
  isBranchManager: boolean;
  isOfficeAdmin: boolean;
  isManager: boolean;
  isTadStaff: boolean;
  canManageRole: (targetRole: UserRole) => boolean;
  isPermissionsLoaded: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

const canManageRoleMap: Record<UserRole, UserRole[]> = {
    'Global Admin': ['Global Admin', 'TAD Admin', 'Regional Manager', 'Area Manager', 'Sales Manager', 'Agency Owner', 'Regional Manager (Agency)', 'Branch Manager', 'Office Administrator', 'Auction Administrator', 'Sales Negotiator', 'Buyer', 'Seller', 'Solicitor', 'Standard User', 'Individual', 'Group of Individuals', 'Company', 'Corporate Body'],
    'TAD Admin': ['Regional Manager', 'Area Manager', 'Sales Manager', 'Agency Owner', 'Regional Manager (Agency)', 'Branch Manager', 'Office Administrator', 'Auction Administrator', 'Sales Negotiator', 'Buyer', 'Seller', 'Solicitor', 'Standard User', 'Individual', 'Group of Individuals', 'Company', 'Corporate Body'],
    'Regional Manager': ['Area Manager', 'Sales Manager', 'Agency Owner', 'Regional Manager (Agency)', 'Branch Manager', 'Office Administrator', 'Sales Negotiator', 'Buyer', 'Seller'],
    'Area Manager': ['Sales Manager', 'Agency Owner', 'Regional Manager (Agency)', 'Branch Manager', 'Office Administrator', 'Sales Negotiator'],
    'Sales Manager': ['Agency Owner', 'Regional Manager (Agency)', 'Branch Manager', 'Office Administrator', 'Sales Negotiator'],
    'Agency Owner': ['Regional Manager (Agency)', 'Branch Manager', 'Office Administrator', 'Sales Negotiator', 'Buyer', 'Seller', 'Solicitor', 'Standard User'],
    'Regional Manager (Agency)': ['Branch Manager', 'Office Administrator', 'Sales Negotiator', 'Buyer', 'Seller'],
    'Branch Manager': ['Office Administrator', 'Sales Negotiator'],
    'Office Administrator': ['Sales Negotiator'],
    'Auction Administrator': ['Sales Negotiator', 'Buyer', 'Seller'],
    'Sales Negotiator': [],
    'Buyer': [],
    'Seller': [],
    'Solicitor': [],
    'Standard User': [],
    'Individual': [],
    'Group of Individuals': [],
    'Company': [],
    'Corporate Body': [],
};

export function PermissionProvider({ children, userProfile }: { children: ReactNode, userProfile: UserProfile }) {
  const { impersonatedRole } = useImpersonation();

  const contextValue = useMemo(() => {
    // REAL identity check for Switcher visibility
    const isGlobalAdmin = GLOBAL_ADMIN_UIDS.includes(userProfile.uid);

    // EFFECTIVE identity check for portal interaction
    const baseRole = isGlobalAdmin ? 'Global Admin' : userProfile.role;
    const effectiveRole = impersonatedRole || (baseRole as UserRole);

    // GUI Environment Flags derived from EFFECTIVE role
    const isAdmin = effectiveRole === 'Global Admin' || effectiveRole === 'TAD Admin';
    const isRegionalManager = effectiveRole === 'Regional Manager';
    const isAreaManager = effectiveRole === 'Area Manager';
    const isSalesManager = effectiveRole === 'Sales Manager';
    const isTadManager = isRegionalManager || isAreaManager || isSalesManager;
    
    const isAgencyOwner = effectiveRole === 'Agency Owner';
    const isAgencyRegionalManager = effectiveRole === 'Regional Manager (Agency)';
    const isBranchManager = effectiveRole === 'Branch Manager';
    const isOfficeAdmin = effectiveRole === 'Office Administrator';
    const isManager = isAgencyOwner || isAgencyRegionalManager || isBranchManager || isOfficeAdmin || isTadManager;

    const isTadStaff = [
        'Global Admin',
        'TAD Admin',
        'Regional Manager',
        'Area Manager',
        'Sales Manager',
        'Auction Administrator'
    ].includes(effectiveRole);

    const canManageRole = (targetRole: UserRole): boolean => {
        if (isGlobalAdmin && !impersonatedRole) return true;
        const manageable = canManageRoleMap[userProfile.role] || [];
        return manageable.includes(targetRole);
    };

    return {
      currentUserProfile: userProfile,
      effectiveRole,
      isGlobalAdmin, 
      isAdmin,       
      isTadManager,
      isRegionalManager,
      isAreaManager,
      isSalesManager,
      isAgencyOwner,
      isAgencyRegionalManager,
      isBranchManager,
      isOfficeAdmin,
      isManager,
      isTadStaff,
      canManageRole,
      isPermissionsLoaded: true,
    };
  }, [userProfile, impersonatedRole]);

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
