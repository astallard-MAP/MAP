"use client";

import { useState } from "react";
import { useDoc, useUser, useFirestore, useMemoFirebase } from "../../../../../firebase";
import { type Property, type PortalActionResult } from "../../../../../lib/types";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import Link from 'next/link';
import { ArrowLeft, Download, Eye, FileText, Image as ImageIcon, Video, Map, BedDouble, Loader2, ShieldCheck, FileCheck, Globe, ShieldAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table";
import { doc } from "firebase/firestore";
import { useToast } from "../../../../../hooks/use-toast";
import { publishToRightmove, publishToZoopla, publishToOTM } from "../../../../../app/actions/portal-actions";
import { usePermissions } from "../../../../../context/PermissionContext";

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
    Draft: "secondary",
    Submitted: "secondary",
    Published: "default",
    Available: "default",
    Sold: "default",
    'Contracts Exchanged': "default",
    Completed: 'default',
    Unsold: "destructive",
};

const formatCurrency = (value?: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
}

export default function PropertyDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { userProfile } = useUser();
    const firestore = useFirestore();
    const { isTadStaff } = usePermissions();
    const { toast } = useToast();
    const [isPublishing, setIsPublishing] = useState<string | null>(null);

    const propertyRef = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'properties', id as string);
    }, [firestore, id]);

    const { data: property, isLoading } = useDoc<Property>(propertyRef);


    const handlePublish = async (portal: 'rightmove' | 'zoopla' | 'otm') => {
      if (!id) return;
      setIsPublishing(portal);
      try {
        let result: PortalActionResult;
        if (portal === 'rightmove') result = await publishToRightmove(id as string);
        else if (portal === 'zoopla') result = await publishToZoopla(id as string);
        else result = await publishToOTM(id as string);

        if (result.success) {
          toast({ title: "Publication Successful", description: result.message });
        } else {
          toast({ variant: "destructive", title: "Publication Failed", description: "error" in result ? result.error : "Unknown error" });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Handshake Error", description: "Critical production relay failure." });
      } finally {
        setIsPublishing(null);
      }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin mr-2"/>Retrieving property archives...</div>
    }

    if (!property) {
        return <div className="p-8 text-center text-destructive font-medium">Audit Error: Property record not found.</div>
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-headline">
                            {property.address?.addressLine1 || 'Unknown'}, {property.address?.postcode || ''}
                        </h1>
                        <p className="text-muted-foreground">
                            {property.headline}
                        </p>
                    </div>
                </div>
            </header>

            {isTadStaff && (
              <Card className="border-l-4 border-l-secondary bg-secondary/5 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-secondary">
                    <Globe className="h-5 w-5" />
                    Portal Publication Desk
                  </CardTitle>
                  <CardDescription>Audit approved lots for transmission to real-time property networks.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => handlePublish('rightmove')} 
                    disabled={!!isPublishing} 
                    variant={property.publishedTo?.rightmove ? "secondary" : "default"}
                    className="h-12 font-bold uppercase tracking-tight"
                  >
                    {isPublishing === 'rightmove' ? <Loader2 className="animate-spin mr-2"/> : <Globe className="mr-2 h-4 w-4"/>}
                    {property.publishedTo?.rightmove ? "Update Rightmove" : "Publish to Rightmove"}
                  </Button>
                  <Button 
                    onClick={() => handlePublish('zoopla')} 
                    disabled={!!isPublishing} 
                    variant={property.publishedTo?.zoopla ? "secondary" : "default"}
                    className="h-12 font-bold uppercase tracking-tight"
                  >
                    {isPublishing === 'zoopla' ? <Loader2 className="animate-spin mr-2"/> : <Globe className="mr-2 h-4 w-4"/>}
                    {property.publishedTo?.zoopla ? "Update Zoopla" : "Publish to Zoopla"}
                  </Button>
                  <Button 
                    onClick={() => handlePublish('otm')} 
                    disabled={!!isPublishing} 
                    variant={property.publishedTo?.otm ? "secondary" : "default"}
                    className="h-12 font-bold uppercase tracking-tight"
                  >
                    {isPublishing === 'otm' ? <Loader2 className="animate-spin mr-2"/> : <Globe className="mr-2 h-4 w-4"/>}
                    {property.publishedTo?.otm ? "Update OnTheMarket" : "Publish to OTM"}
                  </Button>
                </CardContent>
                <CardFooter className="bg-muted/30 pt-4 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Automatic 2026 Material Information validation is active.</p>
                </CardFooter>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={statusVariantMap[property.status] || 'secondary'}>{property.status}</Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Auction Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{property.auctionType}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Guide Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">
                            {property.guidePriceType === 'range' 
                                ? `${formatCurrency(property.guidePriceFrom)} - ${formatCurrency(property.guidePriceTo)}`
                                : formatCurrency(property.guidePrice)
                            }
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reserve Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{formatCurrency(property.reservePrice)}</p>
                    </CardContent>
                </Card>
            </div>
            
            {property.accommodation && property.accommodation.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><BedDouble className="mr-2"/>Accommodation</CardTitle>
                        <CardDescription>
                            The layout and dimensions of the property.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {property.accommodation.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                    <h4 className="font-semibold text-md mb-2 border-b pb-1">{group.group}</h4>
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Room</TableHead>
                                                <TableHead className="text-right">Imperial</TableHead>
                                                <TableHead className="text-right">Metric</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.rooms.map((room, roomIndex) => (
                                                <TableRow key={roomIndex}>
                                                    <TableCell className="font-medium">{room.name}</TableCell>
                                                    <TableCell className="text-right">
                                                        {room.lengthFt || room.lengthIn ? `${room.lengthFt || 0}'${room.lengthIn || 0}" x ${room.widthFt || 0}'${room.widthIn || 0}"` : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {room.lengthM || room.widthM ? `${room.lengthM || 0}m x ${room.widthM || 0}m` : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-primary" />
                        Legal Pack Documents
                    </CardTitle>
                    <CardDescription>Review and download original or redacted legal documents.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-1/2">Document Type</TableHead>
                                    <TableHead>Original</TableHead>
                                    <TableHead>Redacted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {property.legalPack && property.legalPack.length > 0 ? (
                                    property.legalPack.map((doc, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{doc.type}</TableCell>
                                            <TableCell>
                                                {doc.originalUrl ? (
                                                    <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                                                        <a href={doc.originalUrl} target="_blank" rel="noopener noreferrer">
                                                            <Download className="mr-2 h-3 w-3" />
                                                            Download
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {doc.redactedUrl ? (
                                                    <Button variant="secondary" size="sm" asChild className="h-8 text-xs">
                                                        <a href={doc.redactedUrl} target="_blank" rel="noopener noreferrer">
                                                            <Download className="mr-2 h-3 w-3" />
                                                            Download
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">N/A</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic">
                                            No legal documents have been uploaded for this lot.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Marketing Collateral</CardTitle>
                    <CardDescription>
                        View or download the marketing materials for this property.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {property.photographs && property.photographs.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-md mb-2 flex items-center"><ImageIcon className="mr-2"/>Photographs</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {property.photographs.map((url, index) => (
                                    <Link key={index} href={url} target="_blank" rel="noopener noreferrer" className="block border rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                                        <img src={url} alt={`Property photo ${index + 1}`} className="aspect-square w-full object-cover"/>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {property.floorplanUrl && (
                            <Link href={property.floorplanUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="w-full justify-start"><Map className="mr-2"/>View Floor Plan</Button>
                            </Link>
                        )}
                        {property.videoTourUrl && (
                             <Link href={property.videoTourUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="w-full justify-start"><Video className="mr-2"/>Watch Video Tour</Button>
                            </Link>
                        )}
                        {property.virtualTourUrl && (
                            <Link href={property.virtualTourUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="w-full justify-start"><Eye className="mr-2"/>Open Virtual Tour</Button>
                            </Link>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
