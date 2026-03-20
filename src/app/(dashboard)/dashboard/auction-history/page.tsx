"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { History, Search, ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { useRouter } from "next/navigation";
import { AUCTION_HISTORY } from "../../../../lib/auction-history";
import { useDebounce } from "use-debounce";
import { cn } from "../../../../lib/utils";

/**
 * @fileOverview Production Auction History Ledger for MAP261125.
 * Features clinical performance telemetry and historical lot distribution registry.
 */
export default function AuctionHistoryPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch] = useDebounce(searchTerm, 300);

    const filteredHistory = useMemo(() => {
        if (!debouncedSearch) return AUCTION_HISTORY;
        const term = debouncedSearch.toLowerCase();
        return AUCTION_HISTORY.filter(item => 
            item.date.includes(term) || 
            item.venue.toLowerCase().includes(term)
        );
    }, [debouncedSearch]);

    // Forensic KPIs derived from the history registry
    const stats = useMemo(() => {
        const totalOffered = AUCTION_HISTORY.reduce((acc, curr) => acc + curr.lotsOffered, 0);
        const totalSold = AUCTION_HISTORY.reduce((acc, curr) => acc + curr.lotsSold, 0);
        const avgSuccess = Math.round((totalSold / totalOffered) * 100);
        return { totalOffered, totalSold, avgSuccess };
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <header className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center text-slate-900">
                        <History className="mr-3 h-8 w-8 text-primary" />
                        Auction History
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        UK-Standard: Performance audit of all previous property auctions.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-primary bg-primary/5 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Total Auctions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tabular-nums">{AUCTION_HISTORY.length}</div>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase">Confirmed production events</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-brand-secondary bg-brand-secondary/5 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-brand-secondary">Avg. Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tabular-nums">{stats.avgSuccess}%</div>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase">Combined historical performance</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500 bg-green-50/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-green-600">Total Capital Raised</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tabular-nums text-slate-900">£120M+</div>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase">Definitive completion audit</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-md">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle>Historical Ledger</CardTitle>
                            <CardDescription>Definitive record of lot distribution and sales completion.</CardDescription>
                        </div>
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Filter by date or venue..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-bold">Auction Date</TableHead>
                                    <TableHead className="font-bold">Venue</TableHead>
                                    <TableHead className="text-right font-bold">Offered</TableHead>
                                    <TableHead className="text-right font-bold">Sold</TableHead>
                                    <TableHead className="text-right font-bold">% Sold</TableHead>
                                    <TableHead className="text-right font-bold">Total Raised</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((item, index) => (
                                        <TableRow key={index} className="group hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-bold text-slate-900 tabular-nums">{item.date}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[9px] uppercase font-black tracking-tighter">
                                                    {item.venue}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-xs">{item.lotsOffered}</TableCell>
                                            <TableCell className="text-right tabular-nums text-xs font-semibold text-green-600">{item.lotsSold}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={cn(
                                                    "text-[10px] font-black px-2 py-0.5 rounded-full",
                                                    parseInt(item.percentSold) >= 80 ? "bg-green-100 text-green-700" :
                                                    parseInt(item.percentSold) >= 50 ? "bg-blue-100 text-blue-700" :
                                                    "bg-slate-100 text-slate-600"
                                                )}>
                                                    {item.percentSold}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-[11px] font-bold text-slate-700">
                                                {item.totalRaised}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                                            No records matching your search criteria.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
