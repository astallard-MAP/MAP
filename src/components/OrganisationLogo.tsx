"use client";

import { cn } from "../lib/utils";
import Image from "next/image";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "../firebase";
import { Organisation } from "../lib/types";
import PublicBrandLogo from "./PublicBrandLogo";
import { doc } from "firebase/firestore";

const OrganisationLogo = ({ className }: { className?: string }) => {
  const { userProfile } = useUser();
  const firestore = useFirestore();

  const orgDocRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.organisationId) return null;
    return doc(firestore, 'organisations', userProfile.organisationId);
  }, [firestore, userProfile?.organisationId]);

  const { data: organisation } = useDoc<Organisation>(orgDocRef);
  
  // If user is TAD admin, show the official logo.
  if (userProfile?.organisationId === 'tad_hq' || userProfile?.role === 'Global Admin' || userProfile?.role === 'TAD Admin') {
      const defaultAlt = "The Auction Department Logo";
      return (
         <div
          className={cn(
            "flex flex-col items-center justify-center text-center",
            className
          )}
        >
          <Image
            src="/logo.png"
            alt={defaultAlt}
            width={180} 
            height={60}
            className="max-h-16 object-contain"
            priority
            unoptimized
          />
        </div>
      )
  }

  // If the user's org has a custom logo, display it.
  if (organisation?.logoUrl) {
    const logoUrl = organisation.logoUrl;
    const altText = organisation.name ? `${organisation.name} Logo` : "Organisation Logo";

    return (
        <div
        className={cn(
            "flex flex-col items-center justify-center text-center",
            className
        )}
        >
        <Image
            src={logoUrl}
            alt={altText}
            width={180} 
            height={60}
            className="max-h-16 object-contain"
            priority
        />
        </div>
    );
  }
  
  // Fallback for non-TAD orgs without a custom logo.
  return <PublicBrandLogo className={className} />;
};

export default OrganisationLogo;
