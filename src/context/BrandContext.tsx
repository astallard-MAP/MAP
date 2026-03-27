
"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '../firebase';
import { doc } from 'firebase/firestore';
import { type Organisation } from '../lib/types';

interface BrandContextType {
    organisation: Organisation | null;
    brandingEnabled: boolean;
    setBrandingEnabled: (val: boolean) => void;
    primaryColour: string;
    secondaryColour: string;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
    const { userProfile } = useUser();
    const firestore = useFirestore();
    const [brandingEnabled, setBrandingEnabled] = useState(true);

    const orgId = userProfile?.organisationId;
    const { data: organisation } = useDoc<Organisation>(
        orgId ? doc(firestore!, 'organisations', orgId) : null
    );

    const primaryColour = useMemo(() => {
        if (!brandingEnabled || !organisation?.brandColours?.[0]) return '#003366'; // Default brand-primary (Auction Navy)
        return organisation.brandColours[0];
    }, [organisation, brandingEnabled]);

    const secondaryColour = useMemo(() => {
        if (!brandingEnabled || !organisation?.brandColours?.[1]) return '#DAA520'; // Default brand-secondary (Gold)
        return organisation.brandColours[1];
    }, [organisation, brandingEnabled]);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const root = document.documentElement;
            // Inject dynamic branding variables
            root.style.setProperty('--brand-primary', primaryColour);
            root.style.setProperty('--brand-secondary', secondaryColour);
            
            // Generate subtle variants for UI depth
            root.style.setProperty('--brand-primary-muted', `${primaryColour}15`); // 15% opacity hex
            root.style.setProperty('--brand-secondary-muted', `${secondaryColour}15`);
        }
    }, [primaryColour, secondaryColour]);

    return (
        <BrandContext.Provider value={{ 
            organisation: organisation || null, 
            brandingEnabled, 
            setBrandingEnabled,
            primaryColour,
            secondaryColour
        }}>
            {children}
        </BrandContext.Provider>
    );
}

export const useBrand = () => {
    const context = useContext(BrandContext);
    if (context === undefined) {
        throw new Error('useBrand must be used within a BrandProvider');
    }
    return context;
};
