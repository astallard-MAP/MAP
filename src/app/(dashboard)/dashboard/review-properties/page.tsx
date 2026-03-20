"use client";

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useCollection, useFirestore, useMemoFirebase } from "../../../../firebase";
import { type Property, type Organisation } from "../../../../lib/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Eye, ArrowLeft } from 'lucide-react';
import { query, collection, where } from 'firebase/firestore';
import { usePermissions } from "../../../../context/PermissionContext";

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
    Draft: "secondary",
    Submitted: "secondary",
    Published: "default",
    Available: "default",
    Sold: "default",
    "Contracts Exchanged": "default",
    Completed: 'default',
    Unsold: "destructive",
};

type FilterStatus = "All" | "Submitted" | "Published" | "Available";

export default function ReviewPropertiesPage() {
    const { userProfile, loading: userLoading } = useUser();
    const { isAdmin } = usePermissions();
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const statusFromUrl = searchParams.get('status');
    const validStatuses: FilterStatus[] = ["Submitted", "Published", "Available"];
    const initialStatus = statusFromUrl && validStatuses.includes(statusFromUrl as FilterStatus) 
        ? statusFromUrl as FilterStatus 
        : "Submitted";

    const [statusFilter, setStatusFilter] = useState<FilterStatus>(initialStatus);
    const [orgFilter, setOrgFilter] = useState<string>("all");

    const orgsQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return collection(firestore, 'organisations');
    }, [firestore, isAdmin]);

    const { data: organisations, isLoading: orgsLoading } = useCollection<Organisation>(orgsQuery);

    const propertiesQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        let constraints = [];
        if (statusFilter !== "All") {
            constraints.push(where("status", "==", statusFilter));
        }
        if (orgFilter !== "all") {
            constraints.push(where("organisationId", "==", orgFilter));
        }
        return query(collection(firestore, 'properties'), ...constraints);
    }, [firestore, isAdmin, statusFilter, orgFilter]);
    
    const { data: properties, isLoading: propsLoading } = useCollection<Property>(propertiesQuery);

    useEffect(() => {
        if (!userLoading && !isAdmin) {
            router.push('/dashboard');
        }
    }, [userProfile, userLoading, isAdmin, router]);
    
    useEffect(() => {
        const newUrl = statusFilter === 'All' 
            ? '/dashboard/review-properties'
            : `/dashboard/review-properties?status=${statusFilter}`;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }, [statusFilter]);


    const orgNameMap = useMemo(() => {
        if (!organisations) return {};
        return organisations.reduce((acc, org) => {
            acc[org.id] = org.name;
            return acc;
        }, {} as Record<string, string>);
    }, [organisations]);

    if (userLoading || (isAdmin && (propsLoading || orgsLoading))) {
        return <div className="p-8 text-center">Loading audit data...</div>
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
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-slate-900">
                        Review Properties
                    </h1>
                    <p className="text-muted-foreground">
                        Production Desk: Review, approve, and manage all submitted property listings.
                    </p>
                </div>
            </header>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center gap-4">
                        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
                            <TabsList>
                                <TabsTrigger value="Submitted">Submitted</TabsTrigger>
                                <TabsTrigger value="Published">Published</TabsTrigger>
                                <TabsTrigger value="Available">Available</TabsTrigger>
                                <TabsTrigger value="All">All Properties</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="w-full sm:w-auto sm:min-w-[250px]">
                            <Select value={orgFilter} onValueChange={setOrgFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by organisation..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Organisations</SelectItem>
                                    {organisations?.map(org => (
                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Address</TableHead>
                                <TableHead>Organisation</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {properties && properties.length > 0 ? (
                                properties.map(property => (
                                    <TableRow key={property.id}>
                                        <TableCell className="font-medium">
                                            {property.address?.addressLine1 || 'Unknown Address'}
                                            {property.address?.postcode ? `, ${property.address.postcode}` : ''}
                                        </TableCell>
                                        <TableCell>
                                          {property.organisationId 
                                            ? orgNameMap[property.organisationId] || property.organisationId
                                            : 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariantMap[property.status] || 'secondary'}>{property.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/dashboard/properties/${property.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No properties found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
