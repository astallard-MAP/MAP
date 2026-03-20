"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore, useMemoFirebase } from "../../../../firebase";
import { type AppNotification, type PublicUserProfile } from "../../../../lib/types";
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
import { Button } from "../../../../components/ui/button";
import { ArrowLeft, FileSearch, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { collection, query, where } from 'firebase/firestore';

export default function DiagnosticsPage() {
    const { userProfile, isLoading: userLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();

    const isAdmin = userProfile?.role === 'Global Admin' || userProfile?.role === 'TAD Admin';

    // Fetch system error notifications
    const notificationsQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return query(collection(firestore, 'notifications'), where('type', '==', 'SYSTEM_ERROR'));
    }, [firestore, isAdmin]);

    const { data: errorNotifications, isLoading: notificationsLoading } = useCollection<AppNotification>(notificationsQuery);

    // Fetch all users to map createdBy UID to a name
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return collection(firestore, 'publicUsers');
    }, [firestore, isAdmin]);

    const { data: users, isLoading: usersLoading } = useCollection<PublicUserProfile>(usersQuery);

    // Redirect non-admins
    useEffect(() => {
        if (!userLoading && !isAdmin) {
            router.push('/dashboard');
        }
    }, [userProfile, userLoading, isAdmin, router]);

    const userNameMap = useMemo(() => {
        if (!users) return {};
        return users.reduce((acc, user) => {
            acc[user.uid] = user.displayName;
            return acc;
        }, {} as Record<string, string>);
    }, [users]);
    
    const sortedNotifications = useMemo(() => {
        if (!errorNotifications) return [];
        return [...errorNotifications].sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
        });
    }, [errorNotifications]);

    const isLoading = userLoading || notificationsLoading || usersLoading;

    if (isLoading) {
        return <div className="p-8 text-center">Loading diagnostics...</div>;
    }

    if (!isAdmin) {
        return null; // Render nothing while redirecting
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center text-slate-900">
                        <FileSearch className="mr-3" />
                        Diagnostics Log
                    </h1>
                    <p className="text-muted-foreground">
                        Review critical system errors and escalated events.
                    </p>
                </div>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>System Error Log</CardTitle>
                    <CardDescription>
                        A log of all notifications classified as a system error or requiring administrator attention.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead>Triggered By</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedNotifications.length > 0 ? (
                                sortedNotifications.map(notification => (
                                    <TableRow key={notification.id} className="text-destructive/90">
                                        <TableCell className="font-mono text-xs whitespace-nowrap">
                                            {notification.createdAt ? format(notification.createdAt.toDate(), 'dd/MM/yy HH:mm:ss', { locale: enGB }) : '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center">
                                                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                                                <span>{notification.message}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{userNameMap[notification.createdBy] || notification.createdBy}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No system errors have been logged.
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
