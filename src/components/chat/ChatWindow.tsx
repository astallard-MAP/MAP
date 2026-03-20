"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useCollection, useUser, useFirestore, useDoc, useMemoFirebase } from "../../firebase";
import { type SupportMessage, type SupportChat } from "../../lib/types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Send, AlertTriangle } from "lucide-react";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { cn } from "../../lib/utils";
import { ScrollArea, ScrollAreaViewport } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useToast } from "../../hooks/use-toast";
import { PlaceHolderImages } from "../../lib/placeholder-images";
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { askFrankAction } from "../../app/actions/client-ai-actions";
import { usePermissions } from "../../context/PermissionContext";

type ChatWindowProps = {
  chatId: string;
};

export function ChatWindow({ chatId }: ChatWindowProps) {
  const { userProfile } = useUser();
  const { isAdmin } = usePermissions();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [isAiReplying, setIsAiReplying] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  
  const frankAvatar = useMemo(() => PlaceHolderImages.find(img => img.id === 'frank-tadsworth-bids-avatar'), []);

  const chatDocRef = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return doc(firestore, 'supportChats', chatId);
  }, [firestore, chatId]);

  const { data: chatData, isLoading: chatLoading } = useDoc<SupportChat>(chatDocRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return collection(firestore, 'supportChats', chatId, 'messages');
  }, [firestore, chatId]);

  const { data: messages, isLoading: messagesLoading } = useCollection<SupportMessage>(messagesQuery);

  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || 0;
        return timeA - timeB;
    });
  }, [messages]);

  useEffect(() => {
    if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [sortedMessages, chatId]);

  useEffect(() => {
    if (!firestore || !userProfile || !chatId || !chatDocRef) return;
    updateDoc(chatDocRef, isAdmin ? { readByAdmin: true } : { readByUser: true });
  }, [chatId, firestore, userProfile, isAdmin, chatDocRef]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !userProfile || !newMessage.trim() || !chatId || isAiReplying || !chatDocRef) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    const messagesColRef = collection(firestore, 'supportChats', chatId, 'messages');

    addDoc(messagesColRef, {
      text: messageText,
      senderId: userProfile.uid,
      senderName: `${userProfile.firstName} ${userProfile.surname}`,
      senderType: 'user',
      timestamp: serverTimestamp(),
    });
    
    updateDoc(chatDocRef, {
        lastMessageSnippet: messageText.substring(0, 50),
        lastMessageAt: serverTimestamp(),
        readByAdmin: false,
        readByUser: true,
    });

    if (isAdmin || chatData?.escalated) return;
    
    setIsAiReplying(true);
    try {
      const response = await askFrankAction(messageText);
      addDoc(messagesColRef, {
        text: response.text,
        senderId: 'frank-tadsworth-bids',
        senderName: 'Frank',
        senderType: 'model',
        timestamp: serverTimestamp(),
      });
      updateDoc(chatDocRef, {
        lastMessageSnippet: response.text?.substring(0, 50) || "",
        lastMessageAt: serverTimestamp(),
        readByUser: false,
      });
    } catch (error) {
      toast({ variant: 'destructive', title: "AI Offline" });
    } finally {
      setIsAiReplying(false);
    }
  };

  const handleEscalate = async () => {
    if (!firestore || !userProfile || !chatId || chatData?.escalated || !chatDocRef) return;
    try {
        await updateDoc(chatDocRef, { escalated: true, readByAdmin: false });
        toast({ title: "Escalated to Support Team" });
    } catch (error) {
        toast({ variant: 'destructive', title: "Escalation Failed" });
    }
  };

  if (messagesLoading || chatLoading) {
    return <div className="text-center p-4 text-muted-foreground">Initialising production chat session...</div>;
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background shadow-inner">
      <ScrollArea className="flex-1 p-4">
        <ScrollAreaViewport ref={scrollViewportRef}>
            <div className="space-y-4">
            {sortedMessages.map((msg) => (
                <div key={msg.id} className={cn("flex items-start gap-3", msg.senderType === 'user' ? "justify-end" : "")}>
                {msg.senderType !== 'user' && (
                    <Avatar className="h-8 w-8 border">
                        {frankAvatar && <AvatarImage src={frankAvatar.imageUrl} alt="Frank" />}
                        <AvatarFallback className="bg-primary text-primary-foreground">F</AvatarFallback>
                    </Avatar>
                )}
                <div className={cn("max-w-xs md:max-w-md rounded-lg p-3 text-sm shadow-sm", msg.senderType === 'user' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <div className="flex justify-between items-baseline gap-4 mb-1">
                        <p className="font-semibold">{msg.senderName}</p>
                        {msg.timestamp?.toDate && <p className="text-[10px] opacity-70 font-mono">{format(msg.timestamp.toDate(), "HH:mm", { locale: enGB })}</p>}
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
                </div>
            ))}
             {isAiReplying && (
                <div className="flex items-start gap-3">
                     <Avatar className="h-8 w-8 border">
                        {frankAvatar && <AvatarImage src={frankAvatar.imageUrl} alt="Frank" />}
                        <AvatarFallback className="bg-primary text-primary-foreground">F</AvatarFallback>
                    </Avatar>
                    <div className="max-w-xs md:max-w-md rounded-lg p-3 text-sm bg-muted shadow-sm">
                        <p className="font-semibold mb-1">Frank</p>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-foreground/40 rounded-full animate-pulse" /><div className="w-2 h-2 bg-foreground/40 rounded-full animate-pulse delay-150" /></div>
                    </div>
                </div>
             )}
            </div>
        </ScrollAreaViewport>
      </ScrollArea>
      <div className="border-t p-4 space-y-2 bg-muted/30">
        {!chatData?.escalated && !isAdmin && (
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleEscalate}>
                <AlertTriangle className="mr-2 h-3 w-3"/>
                Escalate to Human Support
            </Button>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Type a message..." 
            disabled={isAiReplying} 
            className="bg-background"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || isAiReplying}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
