"use client";

import { useMemo, useState } from "react";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "../../../../firebase";
import { type SolicitorDocument, type Property } from "../../../../lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { FileText, Briefcase, Plus, Search, FileEdit, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Badge } from "../../../../components/ui/badge";
import { Input } from "../../../../components/ui/input";
import Link from 'next/link';
import { format } from 'date-fns';
import { collection, query, where, orderBy } from "firebase/firestore";

export default function SolicitorDashboardPage() {
  const { userProfile, isLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const docsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.solicitorFirmId) return null;
    return query(
      collection(firestore, 'legalDocuments'),
      where('solicitorFirmId', '==', userProfile.solicitorFirmId),
      orderBy('updatedAt', 'desc')
    );
  }, [firestore, userProfile?.solicitorFirmId]);

  const { data: documents, isLoading: docsLoading } = useCollection<SolicitorDocument>(docsQuery);

  const propertiesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.solicitorFirmId) return null;
    return query(
      collection(firestore, 'properties'),
      where('solicitorFirmId', '==', userProfile.solicitorFirmId)
    );
  }, [firestore, userProfile?.solicitorFirmId]);

  const { data: properties, isLoading: propsLoading } = useCollection<Property>(propertiesQuery);

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    return documents.filter(doc => 
      (doc.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.propertyName ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  if (userLoading || docsLoading || propsLoading) {
    return <div className="p-8 text-center"><Loader2 className="animate-spin mr-2 inline" />Initialising Legal Workspace...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center text-slate-900">
            <Briefcase className="mr-3 h-8 w-8 text-primary" />
            Legal Workspace
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Audit Desk: Manage legal packs and document assembly for your associated production lots.
          </p>
        </div>
        <Button asChild className="shadow-md">
          <Link href="/dashboard/solicitor/editor/new">
            <Plus className="mr-2 h-4 w-4" /> Assemble New Document
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>My Legal Documents</CardTitle>
                  <CardDescription>Recently assembled drafts and final conditions.</CardDescription>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search documents..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>Document Title</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredDocs.length > 0 ? (
                        filteredDocs.map((doc) => (
                        <TableRow key={doc.id} className="group hover:bg-muted/30 transition-colors">
                            <TableCell className="font-bold text-slate-900">{doc.title}</TableCell>
                            <TableCell className="text-xs">{doc.propertyName || 'N/A'}</TableCell>
                            <TableCell>
                            <Badge variant={doc.status === 'Draft' ? 'secondary' : 'default'} className="text-[10px] px-1.5 h-5">
                                {doc.status}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-[10px] text-muted-foreground tabular-nums">
                            {doc.updatedAt ? format(doc.updatedAt.toDate(), 'dd/MM/yy HH:mm') : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                <Link href={`/dashboard/solicitor/editor/${doc.id}`}>
                                <FileEdit className="h-4 w-4" />
                                </Link>
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                            No documents found in the current registry.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-l-4 border-l-brand-secondary bg-brand-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-secondary">
                <FileText className="h-4 w-4" />
                Assigned Properties
              </CardTitle>
              <CardDescription className="text-[10px]">Registry: Properties assigned to your firm for legal pack assembly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {properties && properties.length > 0 ? (
                properties.map(prop => (
                  <div key={prop.id} className="p-3 border rounded-lg bg-white hover:border-brand-secondary transition-all shadow-sm group">
                    <p className="font-bold text-xs truncate text-slate-900">{prop.address.addressLine1}, {prop.address.postcode}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-[9px] px-1 h-4 uppercase">{prop.status}</Badge>
                      <Button variant="link" size="sm" asChild className="h-auto p-0 text-[10px] font-bold text-brand-secondary">
                        <Link href={`/dashboard/properties/${prop.id}`}>Audit Lot</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No Active Assignments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
