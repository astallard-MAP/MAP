"use client";

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore, useMemoFirebase } from "../../../../firebase";
import { type Organisation, type PublicUserProfile } from "../../../../lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Building, ArrowLeft, Settings, Loader2 } from 'lucide-react';
import { usePermissions } from "../../../../context/PermissionContext";
import { collection } from 'firebase/firestore';

type FilterStatus = "All" | "Active" | "Pending" | "Invited" | "Inactive" | "Archived";

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
    Active: "default",
    Pending: "secondary",
    Invited: "secondary",
    Inactive: "destructive",
    Archived: "destructive",
};

export default function OrganisationsPage() {
    const { userProfile, isLoading: userLoading } = useUser();
    const { isAdmin, isPermissionsLoaded } = usePermissions();
    const firestore = useFirestore();
    const router = useRouter();

    const [statusFilter, setStatusFilter] = useState<FilterStatus>("All");

    useEffect(() => {
        if (isPermissionsLoaded && !isAdmin) {
            router.push('/dashboard');
        }
    }, [isPermissionsLoaded, isAdmin, router]);

    const orgsQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return collection(firestore, 'organisations');
    }, [firestore, isAdmin]);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return collection(firestore, 'publicUsers');
    }, [firestore, isAdmin]);

    const { data: organisations, isLoading: orgsLoading } = useCollection<Organisation>(orgsQuery);
    const { data: users, isLoading: usersLoading } = useCollection<PublicUserProfile>(usersQuery);

    const ownerNameMap = useMemo(() => {
        if (!users) return {};
        const mapping: Record<string, string> = {};
        users.forEach(user => {
            const orgId = user.organisationId;
            if (user.role === 'Agency Owner' && orgId && typeof orgId === 'string') {
                mapping[orgId] = user.displayName;
            }
        });
        return mapping;
    }, [users]);
    
    const filteredOrganisations = useMemo(() => {
        if (!organisations) return [];
        // Forensic: Filter out organisations with no name or empty data to resolve the 'unknown' registry failure.
        const validOrgs = organisations.filter(org => org.name && org.name.trim() !== "");
        if (statusFilter === 'All') return validOrgs;
        return validOrgs.filter(org => org.status === statusFilter);
    }, [organisations, statusFilter]);

    const isLoading = userLoading || !isPermissionsLoaded || orgsLoading || usersLoading;

    if (isLoading) {
        return (
            <div className="p-8 text-center flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin mr-2"/>
                Retrieving production registry...
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center text-slate-900">
                        <Building className="mr-3" />
                        All Organisations
                    </h1>
                    <p className="text-muted-foreground">
                        Production Audit: View and manage all registered agencies.
                    </p>
                </div>
            </header>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Organisation List</CardTitle>
                            <CardDescription>Complete registry of portal organisations.</CardDescription>
                        </div>
                         <div className="w-full sm:w-auto sm:min-w-[200px]">
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Statuses</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Invited">Invited</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                    <SelectItem value="Archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrganisations.length > 0 ? (
                                filteredOrganisations.map(org => (
                                    <TableRow key={org.id}>
                                        <TableCell className="font-medium">{org.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariantMap[org.status] || 'secondary'}>{org.status}</Badge>
                                        </TableCell>
                                        <TableCell>{ownerNameMap[org.id] || 'Not Assigned'}</TableCell>
                                        <TableCell>{org.generalContactEmail}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/organisation?orgId=${org.id}`}>
                                                   <Settings className="mr-2 h-4 w-4"/> Manage
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No organisations found.
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
