
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Search, MapPin, Bell } from "lucide-react";
import { usePermissions } from "../../../../context/PermissionContext";
import { redirect } from "next/navigation";

export default function BuyerDashboardPage() {
  const { effectiveRole } = usePermissions();

  if (effectiveRole !== 'Buyer' && effectiveRole !== 'Standard User' && effectiveRole !== 'Global Admin' && effectiveRole !== 'TAD Admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center">
          <Search className="mr-3 h-8 w-8 text-primary" />
          Property Search Hub
        </h1>
        <p className="text-muted-foreground mt-2">
          UK-Standard: Configure notifications for properties matching your criteria.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-secondary" />
              Search Profiles
            </CardTitle>
            <CardDescription>Establish your location and property type preferences.</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/10">
            <p className="text-sm text-muted-foreground italic text-center">Search profile creation module under construction.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Recent matches identified by Frank AI.</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/10">
            <p className="text-sm text-muted-foreground italic text-center">Active monitoring pending production data.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
