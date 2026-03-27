
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "../../../firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { useToast } from "../../../hooks/use-toast";
import { ShieldCheck, Mail, ArrowLeft, Loader2, Send } from "lucide-react";
import PublicBrandLogo from "../../../components/PublicBrandLogo";
import Link from "next/link";

/**
 * @fileOverview Production Complaints Submission Portal.
 * UK-EN: Forensic data capture for TPO/RICS compliance.
 */
export default function SubmitComplaintPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    authorName: "",
    authorEmail: "",
    telephone: "",
    subject: "",
    content: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formData.authorName || !formData.authorEmail || !formData.content) {
      toast({ variant: 'destructive', title: "Missing Information", description: "Name, Email, and Grievance Details are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      // PROVOCATIVE: Unique ID Generation (Production Format: COMP-XXXXX)
      const uniqueSuffix = Math.floor(10000 + Math.random() * 90000);
      const complaintRef = `COMP-${uniqueSuffix}`;

      await addDoc(collection(firestore, 'complaints'), {
        complaintRef,
        ...formData,
        status: 'New',
        stage: 1,
        responses: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({ 
        title: "Complaint Registered", 
        description: `Your unique reference is ${complaintRef}. We will respond within 3 working days.` 
      });
      
      router.push('/complaints-procedure'); // Redirect back to information page
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Submission Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/40 p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
            <PublicBrandLogo />
        </div>

        <Card className="shadow-2xl border-t-4 border-t-primary bg-white animate-in zoom-in-95 duration-700">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 ring-8 ring-primary/5">
                <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black font-headline">Register a Formal Complaint</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest mt-1">
                UK-EN Production Intake Desk
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorName" className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Full Name</Label>
                  <Input 
                    id="authorName" 
                    value={formData.authorName}
                    onChange={(e) => setFormData({...formData, authorName: e.target.value})}
                    placeholder="e.g. Mr John Doe"
                    className="h-10 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorEmail" className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Email Address</Label>
                  <Input 
                    id="authorEmail" 
                    type="email"
                    value={formData.authorEmail}
                    onChange={(e) => setFormData({...formData, authorEmail: e.target.value})}
                    placeholder="e.g. john@example.com"
                    className="h-10 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone" className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Telephone (Optional)</Label>
                <Input 
                  id="telephone" 
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  placeholder="e.g. 07700 900XXX"
                  className="h-10 border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Grievance Subject</Label>
                <Input 
                  id="subject" 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="e.g. Delay in Auction Logistics"
                  className="h-10 border-slate-200 font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Detailed Grievance</Label>
                <Textarea 
                  id="content" 
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Please provide as much detail as possible to assist our investigation..."
                  className="min-h-[150px] resize-none border-slate-200 leading-relaxed"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t bg-slate-50/50 p-6">
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Submit Formal Complaint
              </Button>
              <div className="flex items-center justify-between w-full opacity-60">
                <Link href="/complaints-procedure" className="text-[10px] font-bold uppercase hover:text-primary transition-colors flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Back to Procedure
                </Link>
                <p className="text-[10px] italic">Ref: TPO Access Points Guaranteed</p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
