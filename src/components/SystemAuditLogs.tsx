
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { History, ShieldCheck, User, Clock } from "lucide-react";

const mockLogs = [
    { id: 1, action: "User Login", user: "Andrew Stallard", timestamp: "10:42", status: "Success", details: "UA: Chrome/Windows" },
    { id: 2, action: "Property Published", user: "Arthur Royal", timestamp: "09:15", status: "Verified", details: "Lot 4: 101 High Street" },
    { id: 3, action: "AML Mark as Pass", user: "Lucy Slowey", timestamp: "Yesterday", status: "Audit", details: "Subject: David Jones" },
    { id: 4, action: "Template Update", user: "System", timestamp: "Yesterday", status: "Version", details: "MMOA Agreement v1.2" },
];

export function SystemAuditLogs() {
    return (
        <Card className="shadow-lg border-l-4 border-l-brand-primary bg-white overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center">
                            <History className="mr-2 h-4 w-4 text-brand-primary" /> 
                            Root System Audit Trail
                        </CardTitle>
                        <CardDescription className="text-[10px] italic">Forensic record of all administrative and automated actions.</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-brand-primary/20 text-brand-primary bg-white">ROOT ACCESS GRANTED</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-slate-50/30">
                            <TableHead className="text-[10px] font-black uppercase px-6">Timestamp</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Action</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">User</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right px-6">Event Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockLogs.map((log) => (
                            <TableRow key={log.id} className="group hover:bg-slate-50/50 transition-all">
                                <TableCell className="px-6 py-3 font-mono text-[10px] text-slate-400">
                                    <Clock className="inline h-3 w-3 mr-1.5" /> {log.timestamp}
                                </TableCell>
                                <TableCell className="py-3 font-bold text-xs text-slate-900">{log.action}</TableCell>
                                <TableCell className="py-3 text-xs text-slate-600">
                                    <User className="inline h-3 w-3 mr-1.5 text-slate-300" /> {log.user}
                                </TableCell>
                                <TableCell className="text-right px-6 py-3">
                                    <Badge variant="secondary" className="text-[9px] font-black h-4 px-1.5 uppercase bg-brand-primary/5 text-brand-primary border-none">
                                        {log.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-secondary" />
                    <span className="text-[9px] font-black uppercase tracking-tighter italic">End-to-End Encryption Active (Production Node)</span>
                </div>
                <span className="text-[9px] font-bold text-slate-500">MAP v1.0.7-audit</span>
            </div>
        </Card>
    );
}
