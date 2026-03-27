
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useUser, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { AmlCase, AmlAction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
    analyseAmlCaseAction, 
    updateAmlCaseAction, 
    addAmlAuditAction 
} from "@/app/actions/server-actions";
import { 
    Loader2, ShieldAlert, Fingerprint, ArrowLeft, History, 
    CheckCircle2, AlertTriangle, Send, BrainCircuit, Search,
    ScanFace, FileSearch, Scale
} from "lucide-react";
import { format } from "date-fns";

/**
 * @fileOverview Forensic AML Case Detail & AI Audit Desk.
 * UK-EN: Production risk management for MLRO/MLCO.
 */
export default function AmlDetailClientPage() {
  const { id } = useParams();
  const router = useRouter();
  const { userProfile, isLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [actionDesc, setActionDesc] = useState("");
  const [isActing, setIsActing] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);

  const docRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'aml_cases', id as string);
  }, [firestore, id]);

  const { data: amlCase, isLoading: docLoading } = useDoc<AmlCase>(docRef);

  const isAdmin = userProfile?.role === 'Global Admin' || userProfile?.role === 'TAD Admin';

  const handleAnalyse = async () => {
    if (!id || !amlCase) return;
    setIsAnalysing(true);
    try {
        const amlData = {
            type: amlCase.type,
            subjectInfo: amlCase.subjectName,
            riskRating: amlCase.riskRating,
            isPep: amlCase.isPep,
            evidence: amlCase.evidenceUrls || []
        };
        const res = await analyseAmlCaseAction(id as string, amlData);
        if (res.success) {
            toast({ title: "Forensic Audit Complete", description: "Frank AI has recorded compliance recommendations." });
        } else {
            throw new Error(res.error);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Analysis Failed", description: e.message });
    } finally {
        setIsAnalysing(false);
    }
  };

  const handleAddAction = async (isInternal: boolean = false) => {
    if (!id || !actionDesc || !userProfile) return;
    setIsActing(true);
    try {
        const actionObj = {
            id: Math.random().toString(36).substring(7),
            description: actionDesc,
            authorName: userProfile.displayName || 'MLRO',
            isInternalOnly: isInternal,
        };

        const res = await addAmlAuditAction(id as string, actionObj);
        if (res.success) {
            setActionDesc("");
            toast({ title: "Audit Trail Updated", description: "Compliance record has been saved." });
        } else {
            throw new Error(res.error);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Action Failed", description: e.message });
    } finally {
        setIsActing(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!id) return;
    try {
        const payload = {
            status,
            closedAt: status === 'Approved' || status === 'Rejected' ? serverTimestamp() : null
        };
        const res = await updateAmlCaseAction(id as string, payload);
        if (res.success) {
            toast({ title: "Case Status Updated", description: `Case is now marked as ${status}.` });
        } else {
            throw new Error(res.error);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Update Failed", description: e.message });
    }
  };

  if (userLoading || docLoading) {
    return <div className="p-8 text-center flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin mr-2"/>Syncing Forensic Audit File...</div>;
  }

  if (!isAdmin || !amlCase) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline text-slate-900 flex items-center">
                    <Fingerprint className="mr-2 h-6 w-6 text-destructive" />
                    {amlCase.amlRef}: {amlCase.subjectName}
                </h1>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest text-destructive/70">MLRO High-Value Oversight Suite.</p>
            </div>
        </div>
        
        <div className="flex gap-2">
            <Button onClick={handleAnalyse} disabled={isAnalysing} variant="outline" className="border-primary text-primary hover:bg-primary/5 font-black shadow-sm text-xs">
                {isAnalysing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                Run AI Compliance Audit
            </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="shadow-lg border-l-4 border-l-destructive bg-white">
            <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Subject Evidence Summary</CardTitle>
              <div className="flex gap-2">
                <Badge variant={amlCase.riskRating === 'High' ? 'destructive' : 'outline'} className="text-[10px] font-bold">
                    {amlCase.riskRating} RISK
                </Badge>
                {amlCase.isPep && <Badge className="text-[10px] bg-amber-500 font-bold">PEP</Badge>}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-black text-slate-400">Case Type</Label>
                        <p className="font-bold text-slate-900">{amlCase.type}</p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-black text-slate-400">Reference</Label>
                        <p className="font-mono text-xs">{amlCase.amlRef}</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 space-y-3">
                    <p className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                        <ShieldAlert className="h-3 w-3" /> Compliance Metadata
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {amlCase.evidenceUrls && amlCase.evidenceUrls.length > 0 ? (
                            amlCase.evidenceUrls.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" className="text-[10px] bg-white/10 hover:bg-white/20 p-2 rounded flex items-center gap-2 transition-colors">
                                    <FileSearch className="h-3 w-3" /> Verification Document {idx + 1}
                                </a>
                            ))
                        ) : (
                            <span className="text-xs italic opacity-40">No digital evidence uploaded. Professional verification required.</span>
                        )}
                    </div>
                </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 pl-2">MLRO Audit Log (5-Year Retention)</h3>
            {amlCase.actions && amlCase.actions.length > 0 ? (
                amlCase.actions.map((action) => (
                    <Card key={action.id} className={`shadow-sm border-l-2 ${action.isInternalOnly ? 'bg-slate-50 border-l-slate-400' : 'bg-white border-l-destructive'}`}>
                        <CardContent className="p-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                    {action.isInternalOnly ? 'INTERNAL STAFF NOTE' : 'FORENSIC AUDIT RECORD'}
                                </span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {format(action.createdAt?.toDate(), 'dd/MM/yyyy HH:mm')}
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-800 font-medium">{action.description}</p>
                            <div className="pt-2 text-[10px] font-black text-slate-500">
                                – BY: {action.authorName}
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="p-12 text-center text-sm italic text-muted-foreground border-2 border-dashed rounded-2xl bg-slate-50/50">
                    Audit trail is currently empty. AML registry is pending clinical review.
                </div>
            )}
          </div>

          <Card className="shadow-lg border-t-2 border-t-destructive bg-white">
            <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-destructive tracking-widest">Add Audit Action</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea 
                    value={actionDesc}
                    onChange={(e) => setActionDesc(e.target.value)}
                    placeholder="Enter clinical audit details, SAR referral notes, or CDD verification results..."
                    className="min-h-[100px] font-medium leading-relaxed"
                />
            </CardContent>
            <CardFooter className="flex justify-between gap-4 pt-0">
                <p className="text-[8px] italic text-muted-foreground uppercase">Note: These records are permanent for 5 years.</p>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleAddAction(true)} disabled={isActing || !actionDesc}>
                        Internal Note
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleAddAction(false)} disabled={isActing || !actionDesc}>
                        Record Action
                    </Button>
                </div>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-2xl bg-slate-950 border-none text-white overflow-hidden">
            <CardHeader className="bg-destructive p-6">
              <CardTitle className="text-lg flex items-center gap-2"><BrainCircuit className="h-5 w-5"/> Frank AI: MLR Auditor</CardTitle>
              <CardDescription className="text-white/70 text-[10px] font-black uppercase tracking-widest">HMRC/RICS Threshold Audit</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {(amlCase as any).aiRiskAnalysis ? (
                <>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                            <ScanFace className="h-3 w-3" /> Risk Assessment
                        </p>
                        <p className="text-xs leading-relaxed text-slate-300 italic">"{(amlCase as any).aiRiskAnalysis}"</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-destructive tracking-widest flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" /> Forensic "Red Flags"
                        </p>
                        <div className="flex flex-wrap gap-2 text-white">
                            {(amlCase as any).aiRedFlags?.map((flag: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="bg-destructive/20 border-white/10 text-white text-[9px] py-1">
                                    {flag}
                                </Badge>
                            )) || <span className="text-[10px] opacity-40">No immediate flags identified.</span>}
                        </div>
                    </div>

                    <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                            <History className="h-3 w-3" /> Mandatory Procedures (MLR17)
                        </p>
                        <ul className="space-y-2">
                            {amlCase.proceduralChecklist?.map((step, idx) => (
                                <li key={idx} className="text-[10px] flex items-start gap-2 text-slate-200">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                                    {step}
                                </li>
                            )) || <li className="text-[10px] opacity-40 italic">Awaiting AI scan...</li>}
                        </ul>
                    </div>

                    <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                        <Label className="text-[9px] font-black uppercase text-amber-500 mb-1 block">SAR Recommendation</Label>
                        {(amlCase as any).sarRecommendation || 'Manual Decision Required'}
                    </div>
                </>
              ) : (
                <div className="py-20 text-center space-y-4">
                    <BrainCircuit className="h-14 w-14 text-white/5 mx-auto" />
                    <p className="text-xs text-white/40 italic px-6 font-medium">Initiate AML analysis to identify red flags against TAD-AML-001 policy.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2">
                    <Scale className="h-4 w-4" /> MLRO Final Decisions
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-2">
                    {['Pending', 'In Review', 'Approved', 'Rejected', 'SAR Filed'].map((s) => (
                        <Button 
                            key={s} 
                            variant={amlCase.status === s ? 'default' : 'outline'} 
                            size="sm" 
                            className={`text-[9px] h-9 truncate uppercase font-black tracking-tight ${s === 'SAR Filed' && amlCase.status !== s ? 'text-destructive border-destructive/20' : ''}`}
                            onClick={() => handleUpdateStatus(s)}
                        >
                            {s}
                        </Button>
                    ))}
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-blue-400 tracking-widest">
                        <span>HMRC Compliance</span>
                        <span>Stage 3: MLRO Audit</span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
                        UK-EN: Mandatory SAR reporting threshold is "suspicion". If suspicion exists, do not tip off. Referral to NCA mandatory within 24 hours of internal SAR dismissal.
                    </p>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
