
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useUser, useMemoFirebase } from "../../../../../firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { Complaint, ComplaintResponse } from "../../../../../lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import { Textarea } from "../../../../../components/ui/textarea";
import { Label } from "../../../../../components/ui/label";
import { useToast } from "../../../../../hooks/use-toast";
import { 
    analyseAndStoreComplaint, 
    addComplaintResponse, 
    updateComplaintStatus 
} from "../../../../../app/actions/server-actions";
import { 
    Loader2, ShieldCheck, Mail, ArrowLeft, History, 
    CheckCircle2, AlertTriangle, Send, BrainCircuit, MessageSquareText,
    Clock, Scale
} from "lucide-react";
import { format } from "date-fns";

/**
 * @fileOverview Forensic Case Management Interface.
 * UK-EN: AI-assisted complaint resolution system for TPO/RICS compliance.
 */
export default function ComplaintDetailClientPage() {
  const { id } = useParams();
  const router = useRouter();
  const { userProfile, isLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [responseContent, setResponseContent] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);

  const docRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'complaints', id as string);
  }, [firestore, id]);

  const { data: complaint, isLoading: docLoading } = useDoc<Complaint>(docRef);

  const isAdmin = userProfile?.role === 'Global Admin' || userProfile?.role === 'TAD Admin';

  const handleAnalyse = async () => {
    if (!id) return;
    setIsAnalysing(true);
    try {
        const result = await analyseAndStoreComplaint(id as string);
        if (result.success) {
            toast({ title: "Forensic Analysis Complete", description: "Frank AI has audited the grievance and provided production guidance." });
        } else {
            toast({ variant: 'destructive', title: "Analysis Failed", description: result.error });
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Error", description: e.message });
    } finally {
        setIsAnalysing(false);
    }
  };

  const handleAddResponse = async (isInternal: boolean = false) => {
    if (!id || !responseContent || !userProfile) return;
    setIsResponding(true);
    try {
        const result = await addComplaintResponse(
            id as string, 
            responseContent, 
            userProfile.displayName || 'Admin', 
            userProfile.role, 
            isInternal
        );
        if (result.success) {
            setResponseContent("");
            toast({ title: isInternal ? "Note Saved" : "Response Sent", description: "Audit trail updated." });
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Failed", description: e.message });
    } finally {
        setIsResponding(false);
    }
  };

  const handleUpdateStatus = async (status: string, stage: number) => {
    if (!id) return;
    try {
        const result = await updateComplaintStatus(id as string, status, stage);
        if (result.success) {
            toast({ title: "Status Updated", description: `Subject moved to ${status} (Stage ${stage}).` });
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Update Failed", description: e.message });
    }
  };

  if (userLoading || docLoading) {
    return <div className="p-8 text-center flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin mr-2"/>Initialising Audit Desk...</div>;
  }

  if (!isAdmin || !complaint) {
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
                    <History className="mr-2 h-6 w-6 text-primary" />
                    {complaint.complaintRef}: {complaint.subject}
                </h1>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest text-primary">Case Management & AI Audit Suite.</p>
            </div>
        </div>
        
        <div className="flex gap-2">
            <Button onClick={handleAnalyse} disabled={isAnalysing} variant="outline" className="border-secondary text-secondary hover:bg-secondary/5 font-bold shadow-sm">
                {isAnalysing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                Analyse with Frank AI
            </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (The Complaint & Responses) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="shadow-lg border-l-4 border-l-slate-900 bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Original Grievance</CardTitle>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold">STAGE {complaint.stage}</Badge>
                    <Badge className="text-[10px] uppercase font-medium">{complaint.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50/50 border border-slate-100 italic">
                <MessageSquareText className="h-5 w-5 text-slate-400 shrink-0" />
                <p className="text-sm leading-relaxed text-slate-700">{complaint.content}</p>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                <span>By: {complaint.authorName} ({complaint.authorEmail})</span>
                <span>Submitted: {format(complaint.createdAt?.toDate(), 'dd MMM yyyy HH:mm')}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 pl-2">Communication Audit Trail</h3>
            {complaint.responses && complaint.responses.length > 0 ? (
                complaint.responses.map((resp) => (
                    <Card key={resp.id} className={`shadow-sm border-l-2 ${resp.isInternalOnly ? 'bg-amber-50/30 border-l-amber-400' : 'bg-white border-l-slate-200'}`}>
                        <CardContent className="p-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                    {resp.isInternalOnly ? 'INTERNAL NOTE / AI LOG' : 'FORMAL RESPONSE'}
                                </span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {format(resp.createdAt?.toDate(), 'dd/MM/yyyy HH:mm')}
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-800">{resp.content}</p>
                            <div className="pt-2 text-[10px] font-medium text-slate-500">
                                – {resp.authorName} ({resp.authorRole})
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="p-8 text-center text-sm italic text-muted-foreground border-2 border-dashed rounded-xl">No responses logged in the audit trail.</div>
            )}
          </div>

          <Card className="shadow-lg border-t-2 border-t-primary bg-white">
            <CardHeader>
                <CardTitle className="text-sm font-bold uppercase text-primary">Update Audit Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="response" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Formal or Internal Content</Label>
                    <Textarea 
                        id="response" 
                        value={responseContent}
                        onChange={(e) => setResponseContent(e.target.value)}
                        placeholder="Draft response or internal case note..."
                        className="min-h-[120px] resize-none"
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-4 pt-0">
                <Button variant="ghost" className="text-xs italic underline" onClick={() => setResponseContent(complaint.aiRecommendedResponse || "")}>
                    Load AI Recommendation
                </Button>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => handleAddResponse(true)} disabled={isResponding || !responseContent}>
                        Save Internal Note
                    </Button>
                    <Button onClick={() => handleAddResponse(false)} disabled={isResponding || !responseContent} className="font-bold">
                        <Send className="mr-2 h-4 w-4" /> Send Formal Response
                    </Button>
                </div>
            </CardFooter>
          </Card>
        </div>

        {/* RIGHT COLUMN (AI Sidekick & Procedural Guide) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-xl bg-slate-900 border-none text-white overflow-hidden">
            <CardHeader className="bg-primary p-6">
              <CardTitle className="text-lg flex items-center gap-2"><BrainCircuit className="h-5 w-5"/> Frank AI: Compliance Audit</CardTitle>
              <CardDescription className="text-white/70 text-xs font-medium uppercase tracking-widest">Real-Time Forensic Guidance</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {complaint.aiAnalysis ? (
                <>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-secondary tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" /> Core Intelligence
                        </p>
                        <p className="text-xs leading-relaxed text-slate-300 italic">"{complaint.aiAnalysis}"</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-secondary tracking-widest flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" /> Service Flaws Identified
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {complaint.aiFlaws?.map((flaw: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="bg-white/5 border-white/10 text-white text-[9px] py-1">
                                    {flaw}
                                </Badge>
                            )) || <span className="text-[10px] opacity-40">None documented.</span>}
                        </div>
                    </div>

                    <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black uppercase text-secondary tracking-widest flex items-center gap-2">
                            <Clock className="h-3 w-3" /> Procedural Checklist
                        </p>
                        <ul className="space-y-2">
                            {complaint.proceduralNextSteps?.map((step: string, idx: number) => (
                                <li key={idx} className="text-[10px] flex items-start gap-2 text-slate-200">
                                    <span className="bg-white/10 px-1 rounded text-[8px] font-black">{idx + 1}</span>
                                    {step}
                                </li>
                            )) || <li className="text-[10px] opacity-40">Awaiting analysis.</li>}
                        </ul>
                    </div>
                </>
              ) : (
                <div className="py-12 text-center space-y-4">
                    <BrainCircuit className="h-12 w-12 text-white/10 mx-auto" />
                    <p className="text-xs text-white/50 italic px-4">Invoke Frank AI above to audit this grievance against TPO standards.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Scale className="h-4 w-4" /> Procedural Controls
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lifecycle Status</p>
                    <div className="grid grid-cols-2 gap-2">
                        {['Investigating', 'Stage One Complete', 'Stage Two Review', 'Ombudsman', 'Closed'].map((s) => (
                            <Button 
                                key={s} 
                                variant={complaint.status === s ? 'default' : 'outline'} 
                                size="sm" 
                                className="text-[10px] h-8 truncate justify-start"
                                onClick={() => handleUpdateStatus(s, s.includes('One') ? 1 : s.includes('Two') ? 2 : s === 'Ombudsman' ? 3 : complaint.stage)}
                            >
                                {s}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Deadline</span>
                        <Badge variant="outline" className="text-[10px] bg-white border-primary/20 text-primary">{complaint.nextProceduralDeadline || 'TBD'}</Badge>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                        Strict TPO/RICS requirement: Ensure outcome is sent within 15 working days of acknowledgement.
                    </p>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
