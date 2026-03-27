
"use client";

import { useBrand } from "../../context/BrandContext";
import { SmartPriorityWidget } from "../SmartPriorityWidget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  ShieldCheck, 
  Users, 
  Eye,
  Building2,
  PieChart
} from "lucide-react";
import { type UserProfile } from "../../lib/types";

export function DashboardOwner({ userProfile }: { userProfile: UserProfile }) {
  const { brandingEnabled, setBrandingEnabled, organisation } = useBrand();

  return (
    <div className="flex flex-col gap-8">
      {/* STRATEGIC HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-headline uppercase tracking-tight">Strategic Hub</h2>
          <p className="text-muted-foreground font-medium italic">High-level enterprise intelligence for {organisation?.name || 'Your Agency'}.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">White-Label Mode</span>
            <span className="text-xs font-bold text-slate-600">{brandingEnabled ? 'Active (Partner)' : 'Inactive (System)'}</span>
          </div>
          <Switch checked={brandingEnabled} onCheckedChange={setBrandingEnabled} />
        </div>
      </div>

      {/* CORE KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase">Total Revenue (YTD)</CardDescription>
            <CardTitle className="text-2xl font-black flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              £142,500
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-brand-primary shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase">Auction Conversion</CardDescription>
            <CardTitle className="text-2xl font-black flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-primary" />
              78.4%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-brand-secondary shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase">Market Share</CardDescription>
            <CardTitle className="text-2xl font-black flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-secondary" />
                12 active lots
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase">Compliance Score</CardDescription>
            <CardTitle className="text-2xl font-black flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-500" />
              98%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* MAIN INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEADERBOARD */}
        <Card className="lg:col-span-2 shadow-sm bg-white overflow-hidden border">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <Building2 className="mr-2 h-5 w-5 text-slate-400" />
                  Branch Performance Leaderboard
                </CardTitle>
                <CardDescription className="text-xs italic">Operational ranking across the firm.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase">Full Report</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-50/30">
                  <TableHead className="text-[10px] font-bold uppercase px-6">Branch Office</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Staff Count</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Volume</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right px-6">Success</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {['Leigh-on-Sea Main', 'Westcliff Hub', 'Southend Central'].map((b, i) => (
                    <TableRow key={b} className="group">
                      <TableCell className="px-6 font-bold py-4">{b}</TableCell>
                      <TableCell className="py-4"><Users className="inline h-3 w-3 mr-1 text-slate-400"/> {12 - i*3}</TableCell>
                      <TableCell className="py-4">£{2.4 - i*0.5}m</TableCell>
                      <TableCell className="text-right px-6 py-4">
                        <Badge variant={i === 0 ? 'default' : 'secondary'} className="text-[10px] font-bold h-5 uppercase">
                          {92 - i*8}% Effective
                        </Badge>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* SMART PRIORITY LIST */}
        <div className="h-full">
            <SmartPriorityWidget userRole={userProfile.role} organisationId={userProfile.organisationId} />
        </div>
      </div>

      {/* COMPLIANCE & AML HEALTH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b bg-muted/5">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center">
                    <PieChart className="mr-2 h-4 w-4 text-purple-500" /> TPO Membership Status
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-center space-y-4">
                <div className="text-4xl font-black text-slate-900">{organisation?.tpoRegistrationNumber ? 'VERIFIED' : 'PENDING'}</div>
                <p className="text-[10px] text-muted-foreground font-medium">Regulatory registration confirmed with The Property Ombudsman.</p>
                <Button variant="outline" size="sm" className="w-full text-[10px] font-bold uppercase">Update Credentials</Button>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2 shadow-sm border overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/5 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center">
                      <ShieldCheck className="mr-2 h-4 w-4 text-green-500" /> AML Audit Health (Global)
                   </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex items-center gap-8 divide-x">
                    <div className="text-center px-4">
                        <div className="text-3xl font-black text-slate-900">94%</div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Pass Rate</div>
                    </div>
                    <div className="text-center px-8">
                        <div className="text-3xl font-black text-amber-600">6</div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">High Risk Reviews</div>
                    </div>
                    <div className="flex-1 px-8 space-y-2">
                        <p className="text-xs text-slate-600 leading-relaxed italic">&quot;System Insight: Overall AML compliance is robust. 6 pending cases in Westcliff require MLRO signature before contracts can be issued.&quot;</p>
                    </div>
                </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
