"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "../../../../firebase";
import type { Suggestion, PublicUserProfile } from "../../../../lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../../../../components/ui/dropdown-menu";
import { Button } from "../../../../components/ui/button";
import { ArrowUpDown, Ellipsis, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { usePermissions } from "../../../../context/PermissionContext";
import { useRouter } from "next/navigation";
import { doc, updateDoc, where, orderBy, query, collection, type QueryConstraint } from "firebase/firestore";
import { useToast } from "../../../../hooks/use-toast";
import { Badge } from "../../../../components/ui/badge";

type SortKey = "submittedAt" | "importance";
type SortDirection = "asc" | "desc";
type ImportanceLevel = "Essential" | "Medium" | "Low" | "File 13";
type StatusLevel = "new" | "assigned" | "in-progress" | "completed" | "rejected";

const importanceLevels: ImportanceLevel[] = ["Essential", "Medium", "Low", "File 13"];
const statusLevels: StatusLevel[] = ["new", "assigned", "in-progress", "completed", "rejected"];

export default function SuggestionsPage() {
    const { isLoading: userLoading, user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { isAdmin, isPermissionsLoaded } = usePermissions();

    const [sortKey, setSortKey] = useState<SortKey>("submittedAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    useEffect(() => {
        if (!userLoading && isPermissionsLoaded && !isAdmin) {
            router.push('/dashboard');
        }
    }, [userLoading, isAdmin, isPermissionsLoaded, router]);

    const suggestionsQuery = useMemoFirebase(() => {
        if (!isPermissionsLoaded || !user || !firestore) return null;
        let constraints: QueryConstraint[] = [orderBy('submittedAt', 'desc')];
        if (!isAdmin) {
            constraints.push(where('submittedBy', '==', user.uid));
        }
        return query(collection(firestore, 'suggestions'), ...constraints);
    }, [user, isAdmin, isPermissionsLoaded, firestore]);
    
    const { data: suggestions, isLoading: suggestionsLoading } = useCollection<Suggestion>(suggestionsQuery);

    const adminUsersQuery = useMemoFirebase(() => {
      if (!isPermissionsLoaded || !isAdmin || !firestore) return null;
      return query(collection(firestore, 'publicUsers'), where('role', 'in', ['Global Admin', 'TAD Admin']));
    }, [isPermissionsLoaded, isAdmin, firestore]);

    const { data: adminUsers, isLoading: adminsLoading } = useCollection<PublicUserProfile>(adminUsersQuery);
    
    const sortedSuggestions = useMemo(() => {
        if (!suggestions) return [];
        return [...suggestions].sort((a, b) => {
            if (sortKey === "importance") {
                const aIndex = importanceLevels.indexOf(a.importance || "Low");
                const bIndex = importanceLevels.indexOf(b.importance || "Low");
                return sortDirection === 'asc' ? aIndex - bIndex : bIndex - aIndex;
            }
            const timeA = a.submittedAt?.toMillis() || 0;
            const timeB = b.submittedAt?.toMillis() || 0;
            return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        });
    }, [suggestions, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };
    
    const handleUpdateSuggestion = async (suggestionId: string, updateData: Partial<Suggestion>) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'suggestions', suggestionId), updateData);
            toast({ title: "Success", description: "Suggestion has been updated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not update suggestion." });
        }
    };

    if (userLoading || suggestionsLoading || adminsLoading || !isPermissionsLoaded) {
        return <div className="p-8 text-center flex items-center justify-center"><Loader2 className="animate-spin mr-2"/>Loading production suggestions...</div>;
    }

    if (!isAdmin) return null;

  return (
    <div className="flex flex-col gap-6">
        <header className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}><ArrowLeft /></Button>
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-slate-900">User Suggestions</h1>
                <p className="text-muted-foreground font-medium">Review, prioritise, and manage user feedback.</p>
            </div>
        </header>
        <Card>
            <CardHeader><CardTitle>Suggestions Inbox</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Suggestion</TableHead>
                            <TableHead>Submitted By</TableHead>
                            <TableHead><Button variant="ghost" onClick={() => handleSort('submittedAt')}>Date<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                            <TableHead><Button variant="ghost" onClick={() => handleSort('importance')}>Importance<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedSuggestions.length > 0 ? (
                            sortedSuggestions.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="max-w-sm"><p className="font-medium truncate" title={s.suggestionText}>{s.suggestionText}</p><p className="text-xs text-muted-foreground">{s.organisationName || 'N/A'}</p></TableCell>
                                    <TableCell>{s.userName}</TableCell>
                                    <TableCell>{s.submittedAt ? format(s.submittedAt.toDate(), "dd/MM/yy HH:mm", { locale: enGB }) : "-"}</TableCell>
                                    <TableCell><Badge variant="secondary">{s.importance}</Badge></TableCell>
                                    <TableCell>{s.assignedToName || 'Unassigned'}</TableCell>
                                    <TableCell><Badge>{s.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><Ellipsis className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Set Importance</DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent><DropdownMenuRadioGroup value={s.importance} onValueChange={(v) => handleUpdateSuggestion(s.id, { importance: v as ImportanceLevel })}>{importanceLevels.map(l => <DropdownMenuRadioItem key={l} value={l}>{l}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuSubContent>
                                                </DropdownMenuSub>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Set Status</DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent><DropdownMenuRadioGroup value={s.status} onValueChange={(v) => handleUpdateSuggestion(s.id, { status: v as StatusLevel })}>{statusLevels.map(l => <DropdownMenuRadioItem key={l} value={l}>{l}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuSubContent>
                                                </DropdownMenuSub>
                                            </DropdownMenuContent>
                                         </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">No suggestions yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
