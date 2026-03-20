"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser, useCollection, useFirestore, useMemoFirebase } from "../../../../firebase";
import { type Property } from "../../../../lib/types";
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
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Eye, PlusCircle, Pencil, Search, Loader2 } from 'lucide-react';
import { query, collection, where } from 'firebase/firestore';
import { usePermissions } from "../../../../context/PermissionContext";
import { useDebounce } from 'use-debounce';

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


export default function PropertiesPage() {
    const { user, userProfile, isProfileLoaded } = useUser();
    const { isAdmin, isBranchManager, isOfficeAdmin } = usePermissions();
    const firestore = useFirestore();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    const propertiesQuery = useMemoFirebase(() => {
        if (!isProfileLoaded || !userProfile || !firestore) return null;
        
        const constraints = [];
        if (!isAdmin) {
            if (userProfile.organisationId) {
                constraints.push(where("organisationId", "==", userProfile.organisationId));
                if ((isBranchManager || isOfficeAdmin || userProfile.role === 'Sales Negotiator') && userProfile.branchIds?.length > 0) {
                    constraints.push(where('branchId', 'in', userProfile.branchIds));
                }
            } else {
                constraints.push(where("organisationId", "==", "void"));
            }
        }
        
        return query(collection(firestore, 'properties'), ...constraints);
    }, [isProfileLoaded, userProfile, isAdmin, isBranchManager, isOfficeAdmin, firestore]);
    
    const { data: properties, isLoading: propertiesLoading } = useCollection<Property>(propertiesQuery);

    const filteredProperties = useMemo(() => {
        if (!properties) return [];
        if (!debouncedSearchTerm) return properties;

        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        
        return properties.filter(property => {
            const address = property.address;
            if (!address) return false;
            return (
                address.addressLine1?.toLowerCase().includes(lowercasedTerm) ||
                address.addressLine2?.toLowerCase().includes(lowercasedTerm) ||
                address.townCity?.toLowerCase().includes(lowercasedTerm) ||
                address.county?.toLowerCase().includes(lowercasedTerm) ||
                address.postcode?.toLowerCase().includes(lowercasedTerm)
            );
        });
    }, [properties, debouncedSearchTerm]);


    const formatCurrency = (value?: number) => {
        if (typeof value !== 'number') return '-';
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
    }
    
    if (propertiesLoading || !isProfileLoaded) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin mr-2"/>Retrieving production inventory...</div>
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="flex items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Properties
                </h1>
                <p className="text-muted-foreground">
                    View and manage all properties for your organisation.
                </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/submit-property">
                        <PlusCircle className="mr-2" /> Add a Property
                    </Link>
                </Button>
            </header>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle>Your Properties</CardTitle>
                            <CardDescription>
                                A list of all properties submitted by your organisation.
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by address..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Address</TableHead>
                                <TableHead>Headline</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Auction Type</TableHead>
                                <TableHead className="text-right">Reserve Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {properties && filteredProperties.length > 0 ? (
                                filteredProperties.map(property => (
                                    <TableRow key={property.id}>
                                        <TableCell className="font-medium">
                                            {property.address?.addressLine1 || 'Unknown Address'}
                                            {property.address?.postcode ? `, ${property.address.postcode}` : ''}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{property.headline}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariantMap[property.status] || 'secondary'}>{property.status}</Badge>
                                        </TableCell>
                                        <TableCell>{property.auctionType}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(property.reservePrice)}</TableCell>
                                        <TableCell className="text-right">
                                            {property.status === 'Draft' && property.submittedBy === user?.uid && (
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/dashboard/submit-property?id=${property.id}`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            )}
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
                                    <TableCell colSpan={6} className="h-24 text-center">
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
