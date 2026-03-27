
"use client"

import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, ExternalLink, ShieldCheck } from "lucide-react";
import PublicBrandLogo from "../../../components/PublicBrandLogo";

/**
 * @fileOverview Production Complaints Handling Procedure for MAP261125.
 * UK-EN: Complies with TPO and RICS best practice standards.
 */
export default function ComplaintsProcedurePage() {
  const companyDetails = {
    name: "The Auction Department Limited",
    regNumber: "08952748",
    vatNumber: "GB 186 8746 44",
    tpoMembership: "R808",
    headOffice: "Hillsboro’, 377 Southchurch Road, Southend on Sea, Essex, SS1 2PQ",
    registeredOffice: "Monometer House, Rectory Grove, Leigh on Sea, Essex, SS9 2HN",
    phone: "0203 174 0330",
    email: "info@auctiondepartment.com"
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/40 p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
            <PublicBrandLogo />
        </div>
        
        <article className="prose prose-sm md:prose-base dark:prose-invert bg-card text-card-foreground rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
            <div className="bg-primary p-8 md:p-12 text-white">
                <h1 className="text-white mb-2 text-center text-4xl font-headline font-black">Complaints Handling Procedure</h1>
                <p className="text-primary-foreground/90 text-center font-medium opacity-80 uppercase tracking-widest text-xs">Production Compliance: {companyDetails.tpoMembership}</p>
            </div>
            
            <div className="p-6 md:p-10 space-y-8">
                <section>
                    <p className="lead font-medium text-slate-700">
                        <strong>The Auction Department Limited</strong> is committed to providing a professional service to all our clients and members. 
                        When something goes wrong, we need you to tell us about it. This will help us to improve our standards.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        If you have a complaint, please put it in writing, including as much detail as possible. 
                        We will then respond in line with the timeframes set out below (as required by **The Property Ombudsman** and **RICS** best practice).
                    </p>
                </section>

                <hr className="border-slate-100" />

                <section className="space-y-4">
                    <h2 className="flex items-center gap-3 text-slate-900"><ShieldCheck className="text-primary h-6 w-6"/> Stage One: Initial Investigation</h2>
                    <p>Please send your written complaint to our Head Office addressed to the **Complaints Officer**:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 transition-hover hover:border-primary/20">
                            <Mail className="h-5 w-5 text-primary mt-1" />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">By Email</p>
                                <a href={`mailto:${companyDetails.email}`} className="text-sm font-bold text-slate-900 border-b-2 border-primary/20 hover:border-primary transition-all">
                                    {companyDetails.email}
                                </a>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 transition-hover hover:border-primary/20">
                            <MapPin className="h-5 w-5 text-primary mt-1" />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">By Post</p>
                                <p className="text-sm font-bold text-slate-900 leading-snug">
                                    {companyDetails.headOffice}
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm">
                        We will acknowledge your complaint within **3 working days** of receipt. A senior member of staff who was not directly involved in the transaction will then investigate your complaint. 
                        A formal written outcome of our investigation will be sent to you within **15 working days** of sending the acknowledgement letter.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-slate-900">Stage Two: Internal Review</h2>
                    <p>
                        If you remain dissatisfied with the initial response, you can request an independent internal review. 
                        This review will be conducted by a **Director of The Auction Department Limited**.
                    </p>
                    <p className="p-4 rounded-lg bg-amber-50 border-l-4 border-l-amber-400 text-sm italic font-medium">
                        Following the conclusion of this review, we will write to you within **15 working days** of receiving your request for a review. 
                        This response will represent our **Final Viewpoint** on the matter and will include a written statement confirming our final offer (if any).
                    </p>
                </section>

                <div className="bg-slate-900 rounded-xl p-8 text-white space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-3 rounded-lg ring-1 ring-white/20">
                            <ExternalLink className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-white m-0 text-2xl font-bold">The Property Ombudsman</h2>
                    </div>
                    
                    <p className="text-slate-300 text-sm">
                        If you remain dissatisfied with the conclusion of our internal investigation after receiving our Final Viewpoint letter, 
                        or if more than 8 weeks has elapsed since the complaint was first made, you can request an independent review from 
                        **The Property Ombudsman** without charge.
                    </p>
                    
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-xs font-medium space-y-1">
                        <p className="text-amber-400 font-bold uppercase">Important Constraint:</p>
                        <p>You must refer your complaint to The Property Ombudsman within **12 months** of receiving our Final Viewpoint letter.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/10">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Contact Details</p>
                            <p className="text-xs leading-relaxed opacity-80">
                                Milford House, 43-55 Milford Street,<br/>
                                Salisbury, Wiltshire, SP1 2BP
                            </p>
                            <div className="flex items-center gap-2 pt-2">
                                <Phone className="h-3 w-3 text-slate-500" />
                                <span className="text-xs font-bold font-mono">01722 333 306</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ombudsman Master ID</p>
                            <div className="bg-primary/20 text-primary px-3 py-2 rounded-lg inline-block border border-primary/30">
                                <span className="text-xl font-black tracking-tighter tabular-nums">{companyDetails.tpoMembership}</span>
                            </div>
                            <p className="text-[10px] opacity-60">Verified R808 Certification</p>
                        </div>
                    </div>
                </div>

                <section className="space-y-4">
                    <h3 className="text-slate-900 font-black uppercase tracking-widest text-xs">Production Entity Information</h3>
                    <div className="not-prose overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b">
                                <tr>
                                    <th className="px-4 py-3">Audit Detail</th>
                                    <th className="px-4 py-3">Forensic Information</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-900">Legal Entity</td>
                                    <td className="px-4 py-3 opacity-80">{companyDetails.name}</td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-900">Registration No.</td>
                                    <td className="px-4 py-3 font-mono text-xs italic">{companyDetails.regNumber}</td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-900">VAT No.</td>
                                    <td className="px-4 py-3 font-mono text-xs">{companyDetails.vatNumber}</td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-900">Registered Office</td>
                                    <td className="px-4 py-3 text-xs leading-relaxed">{companyDetails.registeredOffice}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </article>
        
        <div className="w-full max-w-4xl mx-auto mt-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link href="/login" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-primary transition-all group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Return to Access Desk
            </Link>
        </div>
      </div>
    </main>
  );
}
