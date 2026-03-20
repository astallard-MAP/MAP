
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useUser, useAuth } from "../../firebase";
import { ImpersonationProvider } from "../../context/ImpersonationContext";
import { PermissionProvider } from "../../context/PermissionContext";
import { Skeleton } from "../../components/ui/skeleton";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "../../components/ui/button";
import DashboardLayout from "../../components/layouts/DashboardLayout";

const LoadingSpinner = ({ text }: { text: string }) => (
    <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-48" />
            <div className="text-lg font-medium text-muted-foreground">{text}</div>
        </div>
    </div>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isLoading, isProfileLoaded } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const [isSignoutInitiated, setIsSignoutInitiated] = useState(false);

  useEffect(() => {
    if (isProfileLoaded && !user && !isSignoutInitiated) {
        router.replace('/login');
    }
  }, [isProfileLoaded, user, router, isSignoutInitiated]);

  const handleLogout = async () => {
    if (!auth) return;
    setIsSignoutInitiated(true);
    try {
        await signOut(auth);
        router.push("/login");
    } catch (e) {
        setIsSignoutInitiated(false);
    }
  };

  if (isLoading || !isProfileLoaded) {
    return <LoadingSpinner text="Authenticating Portal Access..." />;
  }

  if (!user) {
    return null; 
  }
  
  if (!userProfile && !isSignoutInitiated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access & Profile Error</h1>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          The system failed to load your user profile, which is required for access. 
          This may be a temporary issue or a security configuration problem.
        </p>
        <Button onClick={handleLogout} variant="destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout and Try Again
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
            If this issue persists, please contact your Global Administrator.
        </p>
      </div>
    );
  }
  
  return (
    <ImpersonationProvider>
      <PermissionProvider userProfile={userProfile!}>
        <DashboardLayout>{children}</DashboardLayout>
      </PermissionProvider>
    </ImpersonationProvider>
  );
}
