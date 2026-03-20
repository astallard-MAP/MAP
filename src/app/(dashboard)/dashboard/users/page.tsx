"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore, useMemoFirebase } from "../../../../firebase";
import { type PublicUserProfile, type Organisation } from "../../../../lib/types";
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
import { Input } from "../../../../components/ui/input";
import { Users, ArrowLeft, Search, ShieldAlert, Loader2 } from 'lucide-react';
import { usePermissions } from "../../../../context/PermissionContext";
import { collection, query, orderBy } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { UserRoleEnum } from "../../../../lib/schemas";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../components/ui/tooltip";

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
    Active: "default",
    Pending: "secondary",
    Invited: "secondary",
    Inactive: "destructive",
    Archived: "destructive",
};

export default function UsersDirectoryPage() {
    const { userProfile, isLoading: userLoading } = useUser();
    const { isAdmin, isPermissionsLoaded } = usePermissions();
    const firestore = useFirestore();
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [roleFilter, setRoleFilter] = useState<string>("all");

    useEffect(() => {
        if (isPermissionsLoaded && !isAdmin) {
            router.push('/dashboard');
        }
    }, [isPermissionsLoaded, isAdmin, router]);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return query(collection(firestore, 'publicUsers'), orderBy('displayName', 'asc'));
    }, [firestore, isAdmin]);

    const orgsQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return collection(firestore, 'organisations');
    }, [firestore, isAdmin]);

    const { data: users, isLoading: usersLoading } = useCollection<PublicUserProfile>(usersQuery);
    const { data: organisations, isLoading: orgsLoading } = useCollection<Organisation>(orgsQuery);

    const orgNameMap = useMemo(() => {
        if (!organisations) return {};
        return organisations.reduce((acc, org) => {
            acc[org.id] = org.name;
            return acc;
        }, {} as Record<string, string>);
    }, [organisations]);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => {
            const matchesSearch = 
                u.displayName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                u.email?.toLowerCase().includes(debouncedSearch.toLowerCase());
            
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            
            return matchesSearch && matchesRole;
        });
    }, [users, debouncedSearch, roleFilter]);

    const isLoading = userLoading || !isPermissionsLoaded || usersLoading || orgsLoading;

    if (isLoading) {
        return (
            <div className="p-8 text-center flex items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin mr-2"/>
                Retrieving production user directory...
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                <header className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center text-slate-900">
                            <Users className="mr-3" />
                            User Directory
                        </h1>
                        <p className="text-muted-foreground font-medium">
                            Production Audit: Review registered portal profiles.
                        </p>
                    </div>
                </header>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Master Registry</CardTitle>
                                <CardDescription>A complete list of portal personnel.</CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-xl">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search name or email..." 
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="All Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        {UserRoleEnum.options.map((role) => (
                                            <SelectItem key={role} value={role}>{role}</SelectItem>
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
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Organisation</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Audit Trail</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => {
                                        const isHardcoded = [
                                            "YEMX9fZTcZRf0gzaP9WHIUIsaXk1",
                                            "r4q6hhyH9Qg9Ff2uCJQlOYUa1xM2",
                                            "XVtQ7DdJCLVRuPnWhdpshJ0wxwz2",
                                            "W8MAMYxxIBhrOWAz6tcog9DCLUD2"
                                        ].includes(user.uid);

                                        return (
                                            <TableRow key={user.uid}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 flex items-center gap-2">
                                                            {user.displayName}
                                                            {isHardcoded && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <ShieldAlert className="h-3 w-3 text-primary cursor-help" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Hardcoded Root Admin</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs font-medium">{user.role}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs italic">
                                                        {user.organisationId === 'tad_hq' ? 'The Auction Department' : (orgNameMap[user.organisationId || ''] || 'Pending')}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariantMap[user.status] || 'secondary'} className="text-[10px] px-1.5 h-5">
                                                        {user.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/organisation?orgId=${user.organisationId}`)}>
                                                        Audit
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No profiles found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}