
"use client";

import { useBrand } from "../../context/BrandContext";
import { SmartPriorityWidget } from "../SmartPriorityWidget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { 
  ShieldCheck, 
  Files, 
  Gavel, 
  CreditCard,
  FileSearch,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MailCheck,
  AlertTriangle,
  History
} from "lucide-react";
import { type UserProfile } from "../../lib/types";

export function DashboardAdmin({ userProfile }: { userProfile: UserProfile }) {
  const { organisation } = useBrand();

  return (
    <div className="flex flex-col gap-8">
      {/* COMPLIANCE HEADER */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-headline uppercase tracking-tight">Compliance & Logistics Control</h2>
          <p className="text-muted-foreground font-medium italic">Mission-critical infrastructure and legal audit trail management.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-700 shadow-md">
            <ShieldCheck className="h-5 w-5 text-brand-secondary animate-pulse" />
            <div className="text-left text-white">
                <p className="text-[10px] font-black uppercase text-slate-400">Audit Status</p>
                <p className="text-xs font-bold text-white whitespace-nowrap">MAP261125 compliant</p>
            </div>
        </div>
      </div>

      {/* COMPLIANCE KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-brand-primary shadow-sm bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardDescription className="text-[10px] font-bold uppercase">AML/KYC Pass Rate</CardDescription>
                <CardTitle className="text-2xl font-black">94.2%</CardTitle>
            </div>
            <FileSearch className="h-8 w-8 text-brand-primary/20" />
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardDescription className="text-[10px] font-bold uppercase">MoS Signature Rate</CardDescription>
                <CardTitle className="text-2xl font-black">100%</CardTitle>
            </div>
            <Gavel className="h-8 w-8 text-green-500/20" />
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-brand-secondary shadow-sm bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardDescription className="text-[10px] font-bold uppercase">7-Year Retention Compliance</CardDescription>
                <CardTitle className="text-2xl font-black">ACTIVE</CardTitle>
            </div>
            <History className="h-8 w-8 text-brand-secondary/20" />
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEGAL PACK & AUTHORITY TRACKER */}
        <Card className="lg:col-span-2 shadow-sm border bg-white overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center">
                    <Files className="mr-2 h-5 w-5 text-slate-400" />
                    Legal Pack & Instruction Audit
                </CardTitle>
                <CardDescription className="text-xs italic">Verifying official authority to sell and search pack delivery.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/30">
                            <TableHead className="text-[10px] font-bold uppercase px-6">Lot Registry</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase">Sole Selling Rights</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase">Search Status</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase text-right px-6">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[
                            { lot: 'Lot 4: 101 High Street', ssr: 'Verified (E-Sign)', search: 'Ordered (LCC)', status: 'Approved' },
                            { lot: 'Lot 8: 12 High Street', ssr: 'Pending Signature', search: 'Received', status: 'Blocked' },
                            { lot: 'Lot 12: 44 Broadway', ssr: 'Verified (E-Sign)', search: 'Full Pack Ready', status: 'Final' }
                        ].map((b, i) => (
                            <TableRow key={i} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                                <TableCell className="px-6 font-bold py-4">{b.lot}</TableCell>
                                <TableCell className="py-4 text-xs font-black text-slate-600 italic">{b.ssr}</TableCell>
                                <TableCell className="py-4 text-xs font-bold text-slate-500">{b.search}</TableCell>
                                <TableCell className="text-right px-6 py-4">
                                    <Badge variant={b.status === 'Approved' || b.status === 'Final' ? 'default' : 'destructive'} 
                                        className="text-[9px] font-black h-4 px-1.5 uppercase border-none shadow-sm">
                                        {b.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <div className="p-3 bg-muted/5 border-t">
                <Button variant="ghost" size="sm" className="w-full text-[9px] font-black uppercase h-8 text-slate-400 font-headline group hover:text-brand-primary transition-all">
                    Full Compliance Dashboard <ArrowRight className="ml-1.5 h-3 w-3 group-hover:translate-x-1" />
                </Button>
            </div>
        </Card>

        {/* SMART PRIORITY LIST */}
        <div className="h-full">
            <SmartPriorityWidget userRole={userProfile.role} organisationId={userProfile.organisationId} />
        </div>
      </div>

      {/* PAYMENT TRACKER & AML ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-sm border bg-white overflow-hidden border-l-4 border-l-green-600">
              <CardHeader className="pb-3 border-b bg-green-50/20">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center text-green-900">
                      <CreditCard className="mr-2 h-4 w-4 text-green-600" /> Client Account: Payment Ledger
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                  <div className="divide-y divide-green-50">
                    {[
                        { lot: 'Lot 12', type: 'Reservation Fee', amount: '£3,600', status: 'Paid', date: 'Earlier today' },
                        { lot: 'Lot 4', type: '10% Deposit', amount: '£44,500', status: 'Pending Clearance', date: '1h ago' }
                    ].map((p, i) => (
                        <div key={i} className="p-4 flex items-center justify-between group hover:bg-green-50/50 transition-all">
                            <div className="space-y-0.5">
                                <p className="text-sm font-black text-slate-900">{p.lot}: {p.type}</p>
                                <p className="text-xs font-medium text-slate-500 italic">{p.date}</p>
                            </div>
                            <div className="text-right space-y-0.5">
                                <p className="text-sm font-black text-brand-primary">{p.amount}</p>
                                <Badge variant="outline" className={`text-[9px] font-black h-4 px-1.5 ${p.status === 'Paid' ? 'border-green-300 text-green-600 bg-white' : 'border-amber-300 text-amber-600 bg-white'}`}>
                                    {p.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                  </div>
              </CardContent>
              <div className="p-4 bg-slate-50/80 border-t flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">All client account movements audited as forensic.</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
          </Card>

          <Card className="shadow-sm border bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/5">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4 text-amber-600" /> Compliance Audit Trail (MLRO Only)
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                <div className="space-y-4">
                  {[
                    { ref: 'AML-2026-X42', subject: 'David Jones', flag: 'High Risk Sanctions Check Required', time: '12m ago' },
                    { ref: 'AUDIT-261125', subject: 'Westcliff Office', flag: 'TPO Membership Renewal Pending', time: '2d ago' }
                  ].map((f, i) => (
                        <div key={i} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 shadow-sm space-y-2 group cursor-pointer hover:border-brand-primary/20 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2 rounded h-4 flex items-center uppercase">{f.ref}</span>
                                <span className="text-[9px] font-bold text-slate-400 italic">{f.time}</span>
                            </div>
                            <p className="text-xs font-black text-slate-900 group-hover:text-brand-primary transition-colors">{f.subject}</p>
                            <p className="text-[10px] text-slate-600 italic border-l-2 border-amber-500 pl-3 leading-relaxed">{f.flag}</p>
                        </div>
                  ))}
                </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
