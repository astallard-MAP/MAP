"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { type SupportChat } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, PlusCircle } from "lucide-react";
import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { collection, addDoc, serverTimestamp, where, doc, updateDoc, query, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { usePermissions } from "@/context/PermissionContext";

export default function SupportPage() {
    const { userProfile, loading: userLoading } = useUser();
    const { isAdmin } = usePermissions();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const frankAvatar = useMemo(() => PlaceHolderImages.find(img => img.id === 'frank-tadsworth-bids-avatar'), []);

    const userChatsQuery = useMemoFirebase(() => {
        if (!firestore || !userProfile) return null;
        return query(collection(firestore, 'supportChats'), where('userId', '==', userProfile.uid));
    }, [firestore, userProfile]);

    const { data: userChats } = useCollection<SupportChat>(userChatsQuery);
    
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

    const activeChatId = useMemo(() => {
        if (selectedChatId) return selectedChatId;
        if (!isAdmin && userChats && userChats.length > 0) {
            const sortedChats = [...userChats].sort((a, b) => {
                const timeA = a.lastMessageAt?.toMillis() || 0;
                const timeB = b.lastMessageAt?.toMillis() || 0;
                return timeB - timeA;
            });
            return sortedChats[0].id;
        }
        return null;
    }, [selectedChatId, isAdmin, userChats]);
    
    const handleNewChat = async () => {
        if (!firestore || !userProfile) return;

        const existingChatsQuery = query(
            collection(firestore, 'supportChats'),
            where('userId', '==', userProfile.uid)
        );
        const querySnapshot = await getDocs(existingChatsQuery);

        if (!querySnapshot.empty) {
            setSelectedChatId(querySnapshot.docs[0].id);
            return;
        }
        
        try {
            const newChat = {
                userId: userProfile.uid,
                userName: `${userProfile.firstName} ${userProfile.surname}`,
                userEmail: userProfile.email,
                createdAt: serverTimestamp(),
                status: 'open',
                lastMessageSnippet: 'Chat initiated.',
                lastMessageAt: serverTimestamp(),
                readByAdmin: isAdmin,
                readByUser: true,
                escalated: false,
            };
            const docRef = await addDoc(collection(firestore, 'supportChats'), newChat);
            setSelectedChatId(docRef.id);
            toast({ title: "Chat started" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not start chat." });
        }
    };
    
    const handleSelectChat = async (chatId: string) => {
        setSelectedChatId(chatId);
        if (isAdmin && firestore) {
            const chatRef = doc(firestore, 'supportChats', chatId);
            await updateDoc(chatRef, { readByAdmin: true });
        }
    }

    if (userLoading) {
        return <div className="p-8 text-center font-medium">Initialising support desk...</div>;
    }

    return (
        <div className="relative min-h-[calc(100vh-100px)]">
            <div className="flex flex-col gap-6 h-[calc(100vh-100px)] pb-24">
                <header className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline">Support</h1>
                        <p className="text-muted-foreground">UK-EN: Contact us for assistance or chat with Frank.</p>
                    </div>
                </header>

                <div className="grid md:grid-cols-3 gap-6 flex-1 min-h-0">
                    <div className="md:col-span-1 space-y-6 flex flex-col">
                        <Card>
                            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Phone className="h-5 w-5 text-primary"/><a href="tel:02031740330" className="font-medium hover:underline">0203 174 0330</a>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Mail className="h-5 w-5 text-primary"/><a href="mailto:info@auctiondepartment.com" className="font-medium hover:underline">info@auctiondepartment.com</a>
                                </div>
                            </CardContent>
                        </Card>
                        {isAdmin && (
                            <Card className="flex-1 flex flex-col min-h-0">
                                <CardHeader><CardTitle>Support Queues</CardTitle></CardHeader>
                                <CardContent className="flex-1 overflow-y-auto">
                                    <ChatList onSelectChat={handleSelectChat} selectedChatId={activeChatId} />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="md:col-span-2 flex flex-col min-h-0">
                        <Card className="flex-1 flex flex-col">
                            <CardHeader>
                                <CardTitle>Live Support</CardTitle>
                                <CardDescription>{isAdmin ? "Audit Mode: Reviewing session." : "Frank AI: Chat with our expert assistant."}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col min-h-0">
                            {activeChatId ? (
                                    <ChatWindow chatId={activeChatId} />
                            ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg">
                                        <h3 className="text-lg font-semibold">Start a Conversation</h3>
                                        <Button onClick={handleNewChat} className="mt-4"><PlusCircle className="mr-2"/>New Support Chat</Button>
                                    </div>
                            )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
             {frankAvatar && (
                <div className="fixed bottom-4 right-4 z-10 pointer-events-none">
                    <Image src={frankAvatar.imageUrl} alt="Frank" width={150} height={150} className="rounded-full" data-ai-hint="mascot character" />
                </div>
            )}
        </div>
    );
}
