
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, Download, Gavel, Building, ShieldAlert, History } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * @fileOverview Production AML Policy View.
 * UK-EN: Full TAD-AML-001 Policy and Procedures Manual.
 */
export default function AmlPolicyPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-8 px-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black font-headline text-slate-900 flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-destructive" />
          AML Policy & Procedures Manual (TAD-AML-001)
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground italic">
          Version 1.0 (March 2026) | Confidential & For Internal Use Only
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 text-white border-none shadow-xl col-span-1 p-6">
            <h3 className="text-xs font-black uppercase tracking-tighter text-slate-400 mb-2">Compliance Rating</h3>
            <p className="text-2xl font-black">FULLY COMPLIANT</p>
            <p className="text-[10px] text-primary/70 font-bold mt-2 uppercase">Verified Against MLR 2017</p>
        </Card>
        <Card className="bg-white border text-slate-900 shadow-sm col-span-3 p-6 flex items-center justify-between">
            <div>
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-tighter">Document Registry ID</h3>
                <p className="text-lg font-bold">TAD-AML-001-2026</p>
            </div>
            <Button variant="outline" className="font-bold gap-2">
                <Download className="h-4 w-4" /> Export as PDF
            </Button>
        </Card>
      </div>

      <Card className="bg-white shadow-2xl border-t-4 border-t-destructive overflow-hidden">
        <CardContent className="p-12 space-y-12 text-slate-800 leading-relaxed font-serif">
          {/* THE POLICY CONTENT (FORENSIC RECOVERY) */}
          <div className="border-b-2 border-slate-100 pb-8 text-center uppercase tracking-widest">
            <p className="text-sm font-black italic mb-2">The Auction Department Limited</p>
            <h2 className="text-4xl font-black text-slate-900">Anti-Money Laundering</h2>
            <p className="text-lg font-bold">Policy and Procedures Manual</p>
          </div>

          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 border-l-4 border-primary pl-4 uppercase tracking-tighter">1. Introduction and Purpose</h3>
            <p>The Auction Department Limited is committed to the highest standards of integrity, transparency and compliance with all applicable UK anti-money laundering ('AML') legislation.</p>
            <p>This manual has been prepared to comply fully with The Money Laundering, Terrorist Financing and Transfer of Funds Regulations 2017, POCA 2002, and the Terrorism Act 2000.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 border-l-4 border-primary pl-4 uppercase tracking-tighter">2. Scope and Application</h3>
            <p>Universal application to all directors, officers, employees and associates of The Auction Department Limited.</p>
            <p><strong>Business Activities Covered:</strong> Property Auctions, Estate Agency, and all related intermediary activities.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 border-l-4 border-primary pl-4 uppercase tracking-tighter">3. Key Personnel (MLCO & MLRO)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-xs font-black uppercase text-primary mb-2 italic">Role 01</p>
                    <h4 className="font-black text-lg">Money Laundering Compliance Officer</h4>
                    <p className="text-sm italic opacity-70 mt-2 leading-snug">Overall responsibility for implementation and annual review of this manual.</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-xs font-black uppercase text-primary mb-2 italic">Role 02</p>
                    <h4 className="font-black text-lg">Money Laundering Reporting Officer</h4>
                    <p className="text-sm italic opacity-70 mt-2 leading-snug">The nominated individual responsible for receiving internal SARs and NCA reporting.</p>
                </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 border-l-4 border-primary pl-4 uppercase tracking-tighter">4. Customer Due Diligence (CDD)</h3>
            <div className="bg-slate-900 text-slate-200 p-8 rounded-3xl space-y-4 shadow-2xl">
                <p className="text-xs font-black uppercase text-primary tracking-widest">Mandatory Verification Desk</p>
                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div className="p-4 border border-white/10 rounded-xl space-y-2">
                        <p className="font-black text-white italic">List A: Identity</p>
                        <ul className="list-disc pl-4 space-y-1 opacity-60">
                            <li>Valid Passport</li>
                            <li>Photocard Driving Licence</li>
                            <li>National ID Cards (EU)</li>
                        </ul>
                    </div>
                    <div className="p-4 border border-white/10 rounded-xl space-y-2">
                        <p className="font-black text-white italic">List B: Address</p>
                        <ul className="list-disc pl-4 space-y-1 opacity-60">
                            <li>Utility Bill (last 3 months)</li>
                            <li>Bank Statement</li>
                            <li>Mortgage Statement</li>
                        </ul>
                    </div>
                </div>
            </div>
          </section>

          {/* ADD APPENDICES AT THE END */}
          <section className="pt-12 border-t-2 border-slate-100 space-y-6">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <History className="h-6 w-6 text-primary" /> Forensic Audit Appendices
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="secondary" className="font-bold py-8 text-xs h-auto uppercase">Appendix A: Internal SAR Form</Button>
                <Button variant="secondary" className="font-bold py-8 text-xs h-auto uppercase">Appendix B: Vendor Due Diligence</Button>
                <Button variant="secondary" className="font-bold py-8 text-xs h-auto uppercase">Appendix C: Bidder Registration</Button>
            </div>
          </section>
        </CardContent>
      </Card>

      <footer className="text-center text-[10px] font-bold text-muted-foreground uppercase py-8 opacity-40">
        UK Legislation: The Proceeds of Crime Act 2002 | The Money Laundering Regulations 2017 | POCA 2002
      </footer>
    </div>
  );
}
