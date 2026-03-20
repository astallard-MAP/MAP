"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useUser } from "../../firebase";
import { type SupportMessage } from "../../lib/types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Send } from "lucide-react";
import { cn } from "../../lib/utils";
import { ScrollArea, ScrollAreaViewport } from "../../components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { useToast } from "../../hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { PlaceHolderImages } from "../../lib/placeholder-images";
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { Skeleton } from "../../components/ui/skeleton";
import { Timestamp } from "firebase/firestore";
import { askFrankAction } from "../../app/actions/client-ai-actions";

type ChatMessagesProps = {
    messages: SupportMessage[];
    isAiReplying: boolean;
    frankAvatarUrl?: string;
};

function ChatMessages({ messages, isAiReplying, frankAvatarUrl }: ChatMessagesProps) {
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
        }
    }, [messages, isAiReplying]);
    
    return (
        <ScrollArea className="flex-1 p-4">
            <ScrollAreaViewport ref={scrollViewportRef}>
                <div className="space-y-4">
                    {messages.length === 0 && !isAiReplying && (
                        <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                                {frankAvatarUrl && <AvatarImage src={frankAvatarUrl} alt="Frank Tadsworth-Bids" />}
                                <AvatarFallback>F</AvatarFallback>
                            </Avatar>
                            <div className="max-w-xs md:max-w-md rounded-lg p-3 text-sm bg-muted">
                                <p className="font-semibold mb-1">Frank Tadsworth-Bids</p>
                                <p className="whitespace-pre-wrap">Hello! I'm Frank, your friendly auction expert. Ask me anything about the UK property auction process.</p>
                            </div>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex items-start gap-3",
                                msg.senderType === 'user' ? "justify-end" : ""
                            )}
                        >
                            {msg.senderType !== 'user' && (
                                <Avatar className="h-8 w-8">
                                    {frankAvatarUrl && <AvatarImage src={frankAvatarUrl} alt="Frank Tadsworth-Bids" />}
                                    <AvatarFallback>F</AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={cn(
                                    "max-w-xs md:max-w-md rounded-lg p-3 text-sm",
                                    msg.senderType === 'user'
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                <div className="flex justify-between items-baseline gap-4">
                                    <p className="font-semibold">{msg.senderName}</p>
                                    {msg.timestamp && (
                                        <p className="text-xs opacity-70 whitespace-nowrap">
                                            {format(msg.timestamp instanceof Date ? msg.timestamp : msg.timestamp.toDate(), "HH:mm dd/MM/yyyy", { locale: enGB })}
                                        </p>
                                    )}
                                </div>
                                <p className="whitespace-pre-wrap mt-1">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isAiReplying && (
                        <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                                {frankAvatarUrl && <AvatarImage src={frankAvatarUrl} alt="Frank Tadsworth-Bids" />}
                                <AvatarFallback>F</AvatarFallback>
                            </Avatar>
                            <div className="max-w-xs md:max-w-md rounded-lg p-3 text-sm bg-muted">
                                <p className="font-semibold mb-1">Frank</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-foreground rounded-full animate-pulse" />
                                    <div className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-150" />
                                    <div className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-300" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollAreaViewport>
        </ScrollArea>
    );
}


export function AuctionAcademyChatbot() {
  const { userProfile } = useUser();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const frankAvatar = useMemo(() => PlaceHolderImages.find(img => img.id === 'frank-tadsworth-bids-avatar'), []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userProfile || isAiReplying) return;

    const userMessageText = newMessage;
    setNewMessage("");

    const userMessage: SupportMessage = {
      id: uuidv4(),
      text: userMessageText,
      senderId: userProfile.uid,
      senderName: userProfile.displayName || "You",
      senderType: 'user',
      timestamp: Timestamp.fromDate(new Date()),
    };
    setMessages(prev => [...prev, userMessage]);

    setIsAiReplying(true);

    try {
      const result = await askFrankAction(userMessageText);

      const frankMessage: SupportMessage = {
        id: uuidv4(),
        text: result.text || "I apologize, I didn't catch that. Could you rephrase?",
        senderId: 'frank-tadsworth-bids',
        senderName: 'Frank',
        senderType: 'model',
        timestamp: Timestamp.fromDate(new Date()),
      };
      setMessages(prev => [...prev, frankMessage]);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: error.message || "Could not get a response from Frank. Please try again later.",
      });
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsAiReplying(false);
    }
  };


  return (
    <div className="flex flex-col h-full border rounded-lg">
      {isClient ? (
          <ChatMessages 
              messages={messages}
              isAiReplying={isAiReplying}
              frankAvatarUrl={frankAvatar?.imageUrl}
          />
      ) : (
          <div className="flex-1 p-4 space-y-4">
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-16 w-3/4 ml-auto" />
              <Skeleton className="h-16 w-3/4" />
          </div>
      )}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask Frank about auctions..."
            autoComplete="off"
            disabled={isAiReplying}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || isAiReplying}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}