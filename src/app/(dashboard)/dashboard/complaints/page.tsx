
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from "../../../../firebase";
import { query, collection, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Loader2, ShieldCheck, Mail, ArrowLeft, History, FileText } from "lucide-react";
import Link from "next/link";
import { Complaint } from "../../../../lib/types";

/**
 * @fileOverview Production Complaints Register.
 * UK-EN: Mandatory legal registry for TPO/RICS audit trails.
 */
export default function ComplaintsRegisterPage() {
  const router = useRouter();
  const { userProfile, isLoading: userLoading } = useUser();
  const firestore = useFirestore();

  const isAdmin = userProfile?.role === 'Global Admin' || userProfile?.role === 'TAD Admin';

  const complaintsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'complaints'), orderBy('updatedAt', 'desc'));
  }, [firestore, isAdmin]);

  const { data: complaints, isLoading: complaintsLoading } = useCollection<Complaint>(complaintsQuery);

  const formatSafeDate = (val: any) => {
    if (!val) return '-';
    try {
        if (val instanceof Timestamp) return format(val.toDate(), 'dd/MM/yyyy HH:mm');
        if (val.toDate && typeof val.toDate === 'function') return format(val.toDate(), 'dd/MM/yyyy HH:mm');
        return format(new Date(val), 'dd/MM/yyyy HH:mm');
    } catch (e) {
        return '-';
    }
  };

  if (userLoading || complaintsLoading) {
    return <div className="p-8 text-center flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin mr-2"/>Initialising Complaints Registry...</div>;
  }

  if (!isAdmin) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center text-slate-900">
              <ShieldCheck className="mr-3 h-8 w-8 text-primary" />
              Complaints Registry
            </h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Audit Desk: Production Compliance Control</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-none text-white shadow-xl">
            <CardHeader className="pb-2">
                <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Active Grievances</CardDescription>
                <CardTitle className="text-3xl font-black">{complaints?.filter(c => c.status !== 'Closed').length || 0}</CardTitle>
            </CardHeader>
        </Card>
        <Card className="bg-white border-l-4 border-l-amber-400 shadow-sm">
            <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground font-bold uppercase text-[10px]">Awaiting Acknowledgement</CardDescription>
                <CardTitle className="text-3xl font-black">{complaints?.filter(c => c.status === 'New').length || 0}</CardTitle>
            </CardHeader>
        </Card>
        <Card className="bg-white border-l-4 border-l-primary shadow-sm">
            <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground font-bold uppercase text-[10px]">Under Investigation</CardDescription>
                <CardTitle className="text-3xl font-black">{complaints?.filter(c => c.status === 'Investigating').length || 0}</CardTitle>
            </CardHeader>
        </Card>
        <Card className="bg-white border-l-4 border-l-green-400 shadow-sm">
            <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground font-bold uppercase text-[10px]">Closed Cases (MTD)</CardDescription>
                <CardTitle className="text-3xl font-black">{complaints?.filter(c => c.status === 'Closed').length || 0}</CardTitle>
            </CardHeader>
        </Card>
      </div>

      <Card className="bg-white shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">Production Complaint Registry</CardTitle>
          <CardDescription>Comprehensive audit trail of all formal grievances submitted to The Auction Department Limited.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold">Reference</TableHead>
                <TableHead className="font-bold">Subject</TableHead>
                <TableHead className="font-bold">Complainant</TableHead>
                <TableHead className="font-bold">Stage</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Last Active</TableHead>
                <TableHead className="text-right">Audit Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints && complaints.length > 0 ? (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-mono text-xs font-black text-slate-700">{complaint.complaintRef}</TableCell>
                    <TableCell className="font-bold text-slate-900 max-w-[200px] truncate">{complaint.subject}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{complaint.authorName}</span>
                            <span className="text-[10px] text-muted-foreground">{complaint.authorEmail}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest ring-1 ring-primary/20">Stage {complaint.stage}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge 
                            variant={complaint.status === 'Closed' ? 'default' : complaint.status === 'New' ? 'destructive' : 'secondary'} 
                            className="text-[10px] uppercase font-medium bg-opacity-10"
                        >
                            {complaint.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground tabular-nums">
                      {formatSafeDate(complaint.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/complaints/${complaint.id}`}>
                          <History className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                    No active grievances in the registry. Production status is stable.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2 opacity-60">
        <Link href="/.agents/workflows/complaints-handling.md" className="text-[10px] font-bold uppercase flex items-center gap-1 hover:text-primary">
            <FileText className="h-3 w-3" /> View Procedural Workflow
        </Link>
      </div>
    </div>
  );
}
