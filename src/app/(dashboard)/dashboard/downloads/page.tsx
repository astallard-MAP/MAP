
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from "../../../../firebase";
import { type Property } from "../../../../lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Button } from "../../../../components/ui/button";
import { Download, FileJson, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { usePermissions } from "../../../../context/PermissionContext";
import { useRouter } from 'next/navigation';

type FilterStatus = "All" | "Published" | "Available" | "Sold" | "Submitted";
const propertyStatuses: FilterStatus[] = ["Published", "Available", "Sold", "Submitted", "All"];

export default function DownloadsPage() {
    const { isLoading: userLoading } = useUser();
    const { isAdmin, isPermissionsLoaded } = usePermissions();
    const firestore = useFirestore();
    const router = useRouter();

    const [statusFilter, setStatusFilter] = useState<FilterStatus>("Published");
    const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);

    useEffect(() => {
        if (isPermissionsLoaded && !isAdmin) {
            router.push('/dashboard');
        }
    }, [isPermissionsLoaded, isAdmin, router]);

    const propertiesQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        const baseQuery = collection(firestore, 'properties');
        if (statusFilter !== "All") {
            return query(baseQuery, where("status", "==", statusFilter));
        }
        return baseQuery;
    }, [firestore, isAdmin, statusFilter]);

    const { data: properties, isLoading: propsLoading } = useCollection<Property>(propertiesQuery);

    const handleSelectProperty = (property: Property, isSelected: boolean) => {
        setSelectedProperties(prev => 
            isSelected ? [...prev, property] : prev.filter(p => p.id !== property.id)
        );
    };

    const handleSelectAll = (isSelected: boolean) => {
        setSelectedProperties(isSelected ? (properties || []) : []);
    };
    
    const downloadJson = (data: object, filename: string) => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = filename;
        link.click();
    };

    const isLoading = userLoading || !isPermissionsLoaded || propsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin mr-2"/>
                Initialising download centre...
            </div>
        );
    }
    
    if (!isAdmin) return null;

    const allSelected = Boolean(properties && properties.length > 0 && selectedProperties.length === properties.length);

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center text-slate-900">
                    <Download className="mr-3" />
                    Download Centre
                </h1>
                <p className="text-muted-foreground font-medium">UK-Standard: Asset distribution portal.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Filter Properties</CardTitle>
                            <CardDescription>Select a status to view relevant lots.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
                                <SelectTrigger><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                                <SelectContent>
                                    {propertyStatuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Properties</CardTitle>
                            <CardDescription>Choose properties for asset download.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={!!allSelected}
                                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>Property</TableHead>
                                        <TableHead>Guide Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {properties && properties.length > 0 ? (
                                        properties.map(prop => (
                                            <TableRow key={prop.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedProperties.some(p => p.id === prop.id)}
                                                        onCheckedChange={(checked) => handleSelectProperty(prop, !!checked)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {prop.address?.addressLine1 || 'Unknown Address'}
                                                    {prop.address?.postcode ? `, ${prop.address.postcode}` : ''}
                                                </TableCell>
                                                <TableCell>
                                                    {prop.guidePriceType === 'range' 
                                                        ? `£${prop.guidePriceFrom?.toLocaleString() || 0} - £${prop.guidePriceTo?.toLocaleString() || 0}`
                                                        : `£${prop.guidePrice?.toLocaleString() || 0}`
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={3} className="h-24 text-center">No properties found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {selectedProperties.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Download Assets ({selectedProperties.length} selected)</CardTitle>
                        <CardDescription>Click individual files to download.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {selectedProperties.map(prop => (
                            <div key={prop.id} className="border rounded-lg p-4 bg-muted/30">
                                <h3 className="font-bold text-lg border-b pb-2 mb-4">{prop.address?.addressLine1 || prop.id}, {prop.address?.postcode || ''}</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-medium"><FileText className="text-primary"/>Property Data</div>
                                        <Button size="sm" onClick={() => downloadJson(prop, `${prop.id}_data.json`)}>Download JSON</Button>
                                    </div>
                                    {prop.legalPack && prop.legalPack.length > 0 && (
                                        <div>
                                            <h4 className="font-bold flex items-center gap-2 mb-2"><FileText className="h-4 w-4"/>Legal Pack Assets</h4>
                                            <div className="pl-6 space-y-3">
                                                {prop.legalPack.map((doc, i) => (
                                                     <div key={i} className="flex flex-col gap-1 border-l-2 pl-3 py-1">
                                                        <span className="text-xs font-bold text-slate-700">{doc.type}</span>
                                                        <div className="flex gap-3">
                                                            {doc.originalUrl && (
                                                                <a href={doc.originalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] hover:underline text-muted-foreground">
                                                                    <Download className="h-3 w-3" /> Original
                                                                </a>
                                                            )}
                                                            {doc.redactedUrl && (
                                                                <a href={doc.redactedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] hover:underline text-primary font-bold">
                                                                    <Download className="h-3 w-3" /> Redacted
                                                                </a>
                                                            )}
                                                        </div>
                                                     </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
