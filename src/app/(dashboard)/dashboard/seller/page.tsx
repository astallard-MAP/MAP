
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Gavel, FileCheck } from "lucide-react";
import { usePermissions } from "@/context/PermissionContext";
import { redirect } from "next/navigation";

export default function SellerDashboardPage() {
  const { effectiveRole } = usePermissions();

  if (effectiveRole !== 'Seller' && effectiveRole !== 'Standard User' && effectiveRole !== 'Global Admin' && effectiveRole !== 'TAD Admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center">
          <TrendingUp className="mr-3 h-8 w-8 text-primary" />
          Sales Performance
        </h1>
        <p className="text-muted-foreground mt-2">
          Audit Desk: Monitor the progress and interest levels of your property lots.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-secondary" />
              Live Interest
            </CardTitle>
            <CardDescription>Bidding activity and legal pack downloads.</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/10">
            <p className="text-sm text-muted-foreground italic text-center">Performance telemetry initialising.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Conveyancing Progress
            </CardTitle>
            <CardDescription>Timeline tracking for contracts and completion.</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/10">
            <p className="text-sm text-muted-foreground italic text-center">Legal milestone tracker under construction.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
