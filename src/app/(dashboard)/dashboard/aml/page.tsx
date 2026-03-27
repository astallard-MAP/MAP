
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
import { Loader2, ShieldAlert, Fingerprint, ArrowLeft, History, FileWarning, Search, Plus } from "lucide-react";
import Link from "next/link";
import { AmlCase } from "../../../../lib/types";

/**
 * @fileOverview Production AML (Anti-Money Laundering) Registry.
 * UK-EN: Mandatory legal registry for MLR 2017 & POCA 2002 audit trails.
 * Tracks CDD/EDD and suspicious activity for MLRO/HMRC.
 */
export default function AmlRegisterPage() {
  const router = useRouter();
  const { userProfile, isLoading: userLoading } = useUser();
  const firestore = useFirestore();

  const isAdmin = userProfile?.role === 'Global Admin' || userProfile?.role === 'TAD Admin';

  const amlQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'aml_cases'), orderBy('updatedAt', 'desc'));
  }, [firestore, isAdmin]);

  const { data: cases, isLoading: amlLoading } = useCollection<AmlCase>(amlQuery);

  const formatSafeDate = (val: any) => {
    if (!val) return '-';
    try {
        if (val instanceof Timestamp) return format(val.toDate(), 'dd/MM/yyyy HH:mm');
        return format(new Date(val), 'dd/MM/yyyy HH:mm');
    } catch (e) {
        return '-';
    }
  };

  if (userLoading || amlLoading) {
    return <div className="p-8 text-center flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin mr-2"/>Initialising AML Registry...</div>;
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
              <ShieldAlert className="mr-3 h-8 w-8 text-destructive" />
              AML Compliance Registry
            </h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">MLRO/MLCO Desk: TAD-AML-001 Reference Control</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-none text-white shadow-xl">
            <CardHeader className="pb-2">
                <CardDescription className="text-slate-400 font-bold uppercase text-[10px]">Active AML Issues</CardDescription>
                <CardTitle className="text-3xl font-black">{cases?.filter(c => c.status !== 'Approved').length || 0}</CardTitle>
            </CardHeader>
        </Card>
        <Card className="bg-white border-l-4 border-l-amber-500 shadow-sm">
            <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground font-bold uppercase text-[10px]">High Risk / PEPs</CardDescription>
                <CardTitle className="text-3xl font-black">{cases?.filter(c => c.riskRating === 'High' || c.isPep).length || 0}</CardTitle>
            </CardHeader>
        </Card>
        <Card className="bg-white border-l-4 border-l-primary shadow-sm">
            <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground font-bold uppercase text-[10px]">Pending MLRO Approval</CardDescription>
                <CardTitle className="text-3xl font-black">{cases?.filter(c => c.status === 'Pending').length || 0}</CardTitle>
            </CardHeader>
        </Card>
        <Card className="bg-white border-l-4 border-l-destructive shadow-sm">
            <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground font-bold uppercase text-[10px]">SARs Filed (YTD)</CardDescription>
                <CardTitle className="text-3xl font-black">{cases?.filter(c => c.status === 'SAR Filed').length || 0}</CardTitle>
            </CardHeader>
        </Card>
      </div>

      <Card className="bg-white shadow-sm border border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                <Search className="h-5 w-5 text-slate-400" /> Forensic Case Log
            </CardTitle>
            <CardDescription>Anti-Money Laundering Registry for The Auction Department Limited.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold">AML Ref</TableHead>
                <TableHead className="font-bold">Subject</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Risk Rating</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Last Review</TableHead>
                <TableHead className="text-right">Audit Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases && cases.length > 0 ? (
                cases.map((amlCase) => (
                  <TableRow key={amlCase.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-mono text-xs font-black text-slate-700">{amlCase.amlRef}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">{amlCase.subjectName}</span>
                            {amlCase.isPep && <Badge className="w-fit text-[8px] h-4 bg-amber-400 text-white border-none mt-1">PEP IDENTIFIED</Badge>}
                        </div>
                    </TableCell>
                    <TableCell>
                        <span className="text-xs font-medium text-slate-600">{amlCase.type}</span>
                    </TableCell>
                    <TableCell>
                        <Badge 
                            variant="outline" 
                            className={`text-[9px] uppercase font-black tracking-widest ${
                                amlCase.riskRating === 'High' ? 'border-destructive text-destructive' : 
                                amlCase.riskRating === 'Medium' ? 'border-amber-500 text-amber-500' : 
                                'border-emerald-500 text-emerald-500'
                            }`}
                        >
                            {amlCase.riskRating} RISK
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge 
                            variant={amlCase.status === 'Approved' ? 'default' : amlCase.status === 'SAR Filed' ? 'destructive' : 'secondary'} 
                            className="text-[10px] uppercase font-bold"
                        >
                            {amlCase.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground tabular-nums">
                      {formatSafeDate(amlCase.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/aml/${amlCase.id}`}>
                          <Fingerprint className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                    No active AML issues or CDD breaches recorded. Production environment is compliant.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center opacity-70">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileWarning className="h-3 w-3" /> CONFIDENTIAL: Access restricted to MLRO/MLCO
        </p>
        <Link href="/.agents/workflows/aml-compliance.md" className="text-[10px] font-bold uppercase flex items-center gap-1 hover:text-primary">
            <History className="h-3 w-3" /> View Procedural Workflow
        </Link>
      </div>
    </div>
  );
}
