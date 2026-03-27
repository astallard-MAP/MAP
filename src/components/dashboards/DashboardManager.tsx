
"use client";

import { useBrand } from "../../context/BrandContext";
import { SmartPriorityWidget } from "../SmartPriorityWidget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { 
  GitPullRequest, 
  Clock, 
  FileCheck2, 
  Activity, 
  ArrowRight,
  AlertTriangle,
  Users,
  Eye,
  CalendarCheck2
} from "lucide-react";
import { type UserProfile } from "../../lib/types";

export function DashboardManager({ userProfile }: { userProfile: UserProfile }) {
  const { organisation } = useBrand();

  return (
    <div className="flex flex-col gap-8">
      {/* OPERATIONAL HEADER */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-headline uppercase tracking-tight">Operational Desk</h2>
          <p className="text-muted-foreground font-medium italic">Tactical pipeline management for assigned branches.</p>
        </div>
        <div className="hidden md:flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400">Current Focus</p>
                <p className="text-sm font-bold text-brand-primary">Legal Pack Completion</p>
            </div>
            <div className="p-2 bg-brand-primary/10 rounded-full">
                <FileCheck2 className="h-5 w-5 text-brand-primary" />
            </div>
        </div>
      </div>

      {/* OPERATIONAL KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-brand-primary shadow-sm bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardDescription className="text-[10px] font-bold uppercase">Avg. Days to Auction</CardDescription>
                <CardTitle className="text-2xl font-black">21.5 Days</CardTitle>
            </div>
            <Clock className="h-8 w-8 text-brand-primary/20" />
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-brand-secondary shadow-sm bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardDescription className="text-[10px] font-bold uppercase">Legal Pack Ready</CardDescription>
                <CardTitle className="text-2xl font-black">68.2%</CardTitle>
            </div>
            <FileCheck2 className="h-8 w-8 text-brand-secondary/20" />
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-white">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardDescription className="text-[10px] font-bold uppercase">Viewing-to-Bid Ratio</CardDescription>
                <CardTitle className="text-2xl font-black">4.2:1</CardTitle>
            </div>
            <Activity className="h-8 w-8 text-blue-500/20" />
          </CardHeader>
        </Card>
      </div>

      {/* PIPELINE FUNNEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm border bg-white overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center">
                    <GitPullRequest className="mr-2 h-5 w-5 text-slate-400" />
                    Property Pipeline Funnel
                </CardTitle>
                <CardDescription className="text-xs italic">Live inventory progression across all branches.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-black uppercase text-slate-500">New Instructions</span>
                        <span className="text-sm font-black">18 Lots</span>
                    </div>
                    <Progress value={90} className="h-3 bg-slate-100" />
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-black uppercase text-slate-500">Legal Pack / Pending</span>
                        <span className="text-sm font-black">12 Lots</span>
                    </div>
                    <Progress value={60} className="h-3 bg-brand-secondary/30" />
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-end text-brand-primary">
                        <span className="text-xs font-black uppercase">Active Marketing (Production)</span>
                        <span className="text-sm font-black">8 Lots</span>
                    </div>
                    <Progress value={40} className="h-3 bg-brand-primary/20" />
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-end text-green-600">
                        <span className="text-xs font-black uppercase">Auction Day Live</span>
                        <span className="text-sm font-black">3 Lots</span>
                    </div>
                    <Progress value={15} className="h-3 bg-green-100" />
                </div>
            </CardContent>
            <div className="p-4 bg-muted/5 border-t">
                <Button variant="outline" size="sm" className="w-full text-[10px] font-black uppercase h-8 shadow-sm">
                    Open Capacity Manager <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
            </div>
        </Card>

        {/* SMART PRIORITY LIST */}
        <div className="h-full">
            <SmartPriorityWidget userRole={userProfile.role} organisationId={userProfile.organisationId} />
        </div>
      </div>

      {/* TACTICAL ALERTS & STAFF FEED */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-l-4 border-l-amber-500 shadow-sm border bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b bg-amber-50/30">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center text-amber-900">
                      <AlertTriangle className="mr-2 h-4 w-4 text-amber-600" /> Withdrawal Alerts
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                  <div className="divide-y divide-amber-100">
                      <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-amber-50/50 transition-all">
                          <div>
                              <p className="text-xs font-bold text-amber-900">Lot 12: 44 The Broadway</p>
                              <p className="text-[10px] text-amber-600">Pending Withdrawal Fee Investigation (1.2%)</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-700 bg-white">REACTION REQUIRED</Badge>
                      </div>
                      <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-amber-50/50 transition-all">
                          <div>
                              <p className="text-xs font-bold text-slate-800">Lot 8: 12 High Street</p>
                              <p className="text-[10px] text-slate-400">Seller Requesting De-publication</p>
                          </div>
                      </div>
                  </div>
              </CardContent>
          </Card>

          <Card className="shadow-sm border bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/5">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center">
                      <Activity className="mr-2 h-4 w-4 text-brand-primary" /> Staff Productivity Stream
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                      {[
                        { name: 'Arthur Royal', action: 'Created New Property Record', time: '12m ago' },
                        { name: 'Sarah Smith', action: 'Approved AML Verification', time: '24m ago' },
                        { name: 'Edward Brighton', action: 'Uploaded Legal Search Pack', time: '1h ago' }
                      ].map((s, i) => (
                        <div key={i} className="p-4 flex items-center gap-4 group hover:bg-slate-50/80 transition-all">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-brand-primary">
                                {s.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-900">{s.name}</p>
                                <p className="text-[10px] text-slate-500">{s.action}</p>
                            </div>
                            <span className="text-[9px] font-medium text-slate-400 italic">{s.time}</span>
                        </div>
                      ))}
                  </div>
              </CardContent>
              <div className="p-3 bg-slate-50 border-t">
                  <Button variant="ghost" size="sm" className="w-full text-[9px] font-black uppercase h-6 text-slate-400 hover:text-brand-primary">
                      View All Team Activity <Users className="ml-1.5 h-3 w-3" />
                  </Button>
              </div>
          </Card>
      </div>
    </div>
  );
}
