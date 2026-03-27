
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "../../../../firebase";
import { type SolicitorDocument } from "../../../../lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { FileText, Plus, FileEdit, ArrowLeft, Loader2, Mail, Gavel } from "lucide-react";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MMOA_SALES_AGREEMENT_TEMPLATE, TERMS_OF_BIDDING_TEMPLATE } from "@/lib/agreements";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default function DocumentManagementPage() {
  const router = useRouter();
  const { userProfile, isLoading: userLoading } = useUser();
  const firestore = useFirestore();

  const isAdmin = userProfile?.role === 'Global Admin' || userProfile?.role === 'TAD Admin';

  const templatesQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'documentTemplates'), orderBy('updatedAt', 'desc'));
  }, [firestore, isAdmin]);

  const { data: templates, isLoading: templatesLoading } = useCollection<SolicitorDocument>(templatesQuery);

  const displayTemplates = useMemo(() => {
    const systemTemplates = [MMOA_SALES_AGREEMENT_TEMPLATE, TERMS_OF_BIDDING_TEMPLATE];
    if (!templates) return systemTemplates;
    
    // Merge system templates if not already in Firestore (by ID)
    const filteredSystem = systemTemplates.filter(sys => !templates.some(t => t.id === sys.id));
    return [...filteredSystem, ...templates];
  }, [templates]);

  const formatSafeDate = (val: any) => {
    if (!val) return '-';
    try {
        if (val instanceof Timestamp) return format(val.toDate(), 'dd/MM/yyyy HH:mm');
        if (val.toDate && typeof val.toDate === 'function') return format(val.toDate(), 'dd/MM/yyyy HH:mm');
        return format(new Date(val), 'dd/MM/yyyy HH:mm');
    } catch (e) {
        return '-';
    }
  };

  const getCreationLink = (type: string, category: string) => {
     return `/dashboard/document-management/editor/new?type=${encodeURIComponent(type)}&category=${encodeURIComponent(category)}`;
  };

  if (userLoading || templatesLoading) {
    return <div className="p-8 text-center flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin mr-2"/>Initialising Document Templates...</div>;
  }

  if (!isAdmin) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center text-slate-900">
              <FileText className="mr-3 h-8 w-8 text-primary" />
              Document Templates
            </h1>
            <p className="text-muted-foreground font-medium">Audit Desk: Manage master communications and production agreements.</p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="font-bold shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Create New Template <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">E-Mails</DropdownMenuLabel>
            <DropdownMenuGroup>
              {['On-Boarding', 'Marketing', 'Financial', 'Legal', 'Compliance'].map(cat => (
                <DropdownMenuItem key={cat} asChild>
                  <Link href={getCreationLink('Email', cat)}>{cat}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Documents</DropdownMenuLabel>
            <DropdownMenuGroup>
              {['Pre-Auction', 'Auction Day', 'Post Auction', 'Compliance'].map(cat => (
                <DropdownMenuItem key={cat} asChild>
                  <Link href={getCreationLink('Document', cat)}>{cat}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Notifications</DropdownMenuLabel>
            <DropdownMenuGroup>
              {['Admin', 'Staff', 'Agency', 'Compliance'].map(cat => (
                <DropdownMenuItem key={cat} asChild>
                  <Link href={getCreationLink('Notification', cat)}>{cat}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Gavel className="mr-2 h-5 w-5 text-primary"/> Sales Agreements</CardTitle>
            <CardDescription className="text-xs">Manage the legal contracts for production lots.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/document-management/editor/sales-agreement-v1">Edit Master Agreement</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Mail className="mr-2 h-5 w-5 text-secondary"/> Email Templates</CardTitle>
            <CardDescription className="text-xs">Customise portal invitations and notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/document-management/editor/portal-invite-v1">Edit Invitation Email</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm border">
        <CardHeader>
          <CardTitle>Template Registry</CardTitle>
          <CardDescription>Comprehensive list of all assembled document templates.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayTemplates.length > 0 ? (
                displayTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-bold text-slate-900">{template.title}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{template.type || 'Legacy'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600 italic">
                        {template.category || 'Unclassified'}
                    </TableCell>
                    <TableCell>
                        <Badge variant={template.status === 'Final' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                            {template.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground tabular-nums">
                      {formatSafeDate(template.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/document-management/editor/${template.id}`}>
                          <FileEdit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                    No custom templates assembled. Use the dropdown above to start a new production template.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

