
"use client";

import { useBrand } from "../../context/BrandContext";
import { SmartPriorityWidget } from "../SmartPriorityWidget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { 
  Users, 
  MessageSquare, 
  Eye, 
  MonitorPlay,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MailCheck,
  ShieldCheck
} from "lucide-react";
import { type UserProfile } from "../../lib/types";

export function DashboardNegotiator({ userProfile }: { userProfile: UserProfile }) {
  const { organisation } = useBrand();

  return (
    <div className="flex flex-col gap-8">
      {/* RELATIONSHIP HEADER */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-headline uppercase tracking-tight">Sales & Relationship Hub</h2>
          <p className="text-muted-foreground font-medium italic">Empowering the Negotiator as the single point of contact for the seller.</p>
        </div>
        <div className="flex items-center gap-3 bg-brand-primary p-3 rounded-lg border border-brand-primary/20 shadow-md">
            <MonitorPlay className="h-5 w-5 text-white animate-pulse" />
            <div className="text-left text-white">
                <p className="text-[10px] font-black uppercase text-white/70">Live Watchlist</p>
                <p className="text-xs font-bold whitespace-nowrap">2 Lots Live - Online Timed</p>
            </div>
            <Button variant="outline" size="sm" className="h-6 text-[9px] font-black bg-white/10 border-white/20 text-white hover:bg-white/20">VIEW AUCTION</Button>
        </div>
      </div>

      {/* RELATIONSHIP KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-brand-primary shadow-sm bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardDescription className="text-[10px] font-bold uppercase">Bidders per Lot (Avg)</CardDescription>
                <CardTitle className="text-2xl font-black">6.4 Bidders</CardTitle>
            </div>
            <Users className="h-8 w-8 text-brand-primary/20" />
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardDescription className="text-[10px] font-bold uppercase">Pre-Auction Offers</CardDescription>
                <CardTitle className="text-2xl font-black">£215,000</CardTitle>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500/20" />
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-blue-400 shadow-sm bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardDescription className="text-[10px] font-bold uppercase">Seller Interest Sentiment</CardDescription>
                <CardTitle className="text-2xl font-black">92% Positive</CardTitle>
            </div>
            <Badge variant="outline" className="h-8 w-8 rounded-full border-blue-100 flex items-center justify-center p-0">
                <MessageSquare className="h-4 w-4 text-blue-400" />
            </Badge>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BIDDER VERIFICATION QUEUE */}
        <Card className="lg:col-span-2 shadow-sm border bg-white overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center">
                    <ShieldCheck className="mr-2 h-5 w-5 text-slate-400" />
                    Bidder Verification Queue
                </CardTitle>
                <CardDescription className="text-xs italic">Review & approve ID/Proof of Funds for prospective buyers.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/30">
                            <TableHead className="text-[10px] font-bold uppercase px-6">Bidder Name</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase">Lot Number</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase">ID Status</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase text-right px-6">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[
                            { name: 'David Jones', lot: 'Lot 4', status: 'Pending Review', risk: 'Low' },
                            { name: 'Sarah Miller', lot: 'Lot 12', status: 'Experian Verified', risk: 'Low' },
                            { name: 'Michael Brown', lot: 'Lot 4', status: 'Incomplete ID', risk: 'Medium' }
                        ].map((b, i) => (
                            <TableRow key={i} className="group hover:bg-slate-50/50 transition-all">
                                <TableCell className="px-6 font-bold py-4">{b.name}</TableCell>
                                <TableCell className="py-4 font-medium italic text-slate-600">{b.lot}</TableCell>
                                <TableCell className="py-4">
                                    <Badge variant={b.status === 'Experian Verified' ? 'default' : 'secondary'} className="text-[10px] font-bold h-5 uppercase">
                                        {b.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right px-6 py-4">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-brand-primary hover:text-white transition-all">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <div className="p-3 bg-muted/5 border-t">
                <Button variant="ghost" size="sm" className="w-full text-[9px] font-black uppercase h-8 text-slate-400 group hover:text-brand-primary">
                    Full Registration Portal <ArrowRight className="ml-1.5 h-3 w-3 group-hover:translate-x-1" />
                </Button>
            </div>
        </Card>

        {/* SMART PRIORITY LIST */}
        <div className="h-full">
            <SmartPriorityWidget userRole={userProfile.role} organisationId={userProfile.organisationId} />
        </div>
      </div>

      {/* SELLER LOG & AUCTION DAY WATCHLIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-sm border bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/5">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center">
                      <MailCheck className="mr-2 h-4 w-4 text-brand-primary" /> Seller Advisory Log (AI Monitored)
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {[
                        { lot: 'Lot 4', advice: 'Advised guide price at £215k following market intel.', time: '2h ago' },
                        { lot: 'Lot 12', advice: 'Recommended reserve reduction of 5% following low bidder activity.', time: 'Yesterday' }
                    ].map((s, i) => (
                        <div key={i} className="p-4 flex flex-col gap-1 group hover:bg-slate-50/80 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-brand-primary uppercase">{s.lot}</span>
                                <span className="text-[9px] font-medium text-slate-300 italic">{s.time}</span>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed italic">{s.advice}</p>
                        </div>
                    ))}
                  </div>
              </CardContent>
              <div className="p-4 bg-slate-50 border-t flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic font-headline">AI Sentinel: Advisories Consistent with TPO Guidelines</span>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
          </Card>

          <Card className="shadow-sm border bg-white overflow-hidden">
              <CardHeader className="pb-2 border-b bg-brand-primary/5">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center text-brand-primary">
                      <MonitorPlay className="mr-2 h-4 w-4 text-brand-primary" /> Live Lot Watchlist
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                  <div className="p-4 rounded-xl border-l-4 border-l-brand-secondary bg-slate-50 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-slate-900">Lot 4: 101 High Street</span>
                          <Badge variant="default" className="text-[10px] font-bold animate-pulse uppercase h-5">IN ROOM LIVE</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="text-center bg-white p-2 rounded-lg border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Current Bid</p>
                              <p className="text-lg font-black text-brand-primary">£445,000</p>
                          </div>
                          <div className="text-center bg-white p-2 rounded-lg border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Registered</p>
                              <p className="text-lg font-black text-brand-secondary">12 Bidders</p>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-white opacity-50 space-y-2">
                       <p className="text-xs font-bold text-muted-foreground italic">No further properties live in this session.</p>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
