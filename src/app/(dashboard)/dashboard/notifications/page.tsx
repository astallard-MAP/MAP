"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
import { Eye, ArrowLeft, Trash2, Mail } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { formatDistanceToNow } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { doc, updateDoc, deleteDoc, collection } from 'firebase/firestore';
import { errorEmitter } from "../../../../firebase/error-emitter";
import { FirestorePermissionError } from "../../../../firebase/errors";

export default function NotificationsPage() {
    const { userProfile, isLoading: userLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const [filter, setFilter] = useState<'All' | 'Unread'>('Unread');

    const notificationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'notifications');
    }, [firestore]);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'publicUsers');
    }, [firestore]);

    const { data: notifications, isLoading: notificationsLoading } = useCollection<AppNotification>(notificationsQuery);
    const { data: users, isLoading: usersLoading } = useCollection<PublicUserProfile>(usersQuery);

    const isAdmin = userProfile?.role === 'Global Admin' || userProfile?.role === 'TAD Admin';

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

    const filteredNotifications = useMemo(() => {
        if (!notifications) return [];
        const sorted = [...notifications].sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
        });

        if (filter === 'Unread') {
            return sorted.filter(n => !n.read);
        }
        return sorted;
    }, [notifications, filter]);

    const handleMarkAsRead = (id: string) => {
        if (!firestore) return;
        const notifRef = doc(firestore, 'notifications', id);
        const payload = { read: true };
        updateDoc(notifRef, payload)
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: notifRef.path,
                    operation: 'update',
                    requestResourceData: payload,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };
    
    const handleDelete = (id: string) => {
        if (!firestore) return;
        const notifRef = doc(firestore, 'notifications', id);
        deleteDoc(notifRef)
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: notifRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    if (userLoading || notificationsLoading || usersLoading) {
        return <div className="p-8 text-center">Loading audit notifications...</div>
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
                    <h1 className="text-3xl font-bold tracking-tight font-headline">
                        Notifications
                    </h1>
                    <p className="text-muted-foreground">
                        Review system events and alerts.
                    </p>
                </div>
            </header>
            <Card>
                <CardHeader>
                    <Tabs value={filter} onValueChange={(value) => setFilter(value as 'All' | 'Unread')}>
                        <TabsList>
                            <TabsTrigger value="Unread">Unread</TabsTrigger>
                            <TabsTrigger value="All">All</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Message</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredNotifications.length > 0 ? (
                                filteredNotifications.map(notification => (
                                    <TableRow key={notification.id} className={notification.read ? 'text-muted-foreground' : 'font-medium'}>
                                        <TableCell>
                                            <p>{notification.message}</p>
                                        </TableCell>
                                        <TableCell>{userNameMap[notification.createdBy] || 'System'}</TableCell>
                                        <TableCell>
                                            {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: enGB }) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            {notification.link && (
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={notification.link}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            )}
                                            {!notification.read && (
                                                <Button variant="ghost" size="icon" onClick={() => handleMarkAsRead(notification.id)}>
                                                    <Mail className="h-4 w-4" />
                                                </Button>
                                            )}
                                             <Button variant="ghost" size="icon" onClick={() => handleDelete(notification.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No notifications found.
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
