"use client";

import { useCollection, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { type SupportChat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { collection } from "firebase/firestore";

type ChatListProps = {
  onSelectChat: (chatId: string) => void;
  selectedChatId: string | null;
};

export function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const { userProfile } = useUser();
  const firestore = useFirestore();
  const isAdmin = userProfile?.role === 'Global Admin' || userProfile?.role === 'TAD Admin';

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'supportChats');
  }, [firestore, isAdmin]);

  const { data: chats, isLoading } = useCollection<SupportChat>(chatsQuery);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading active queues...</div>;
  }

  if (!chats || chats.length === 0) {
    return <div className="text-center text-muted-foreground py-4">No active chats.</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {(chats || [])
        .sort((a,b) => (b.lastMessageAt?.toMillis?.() || 0) - (a.lastMessageAt?.toMillis?.() || 0))
        .map((chat) => (
        <button
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={cn(
            "w-full text-left p-3 rounded-lg border transition-colors hover:bg-muted",
            chat.id === selectedChatId ? "bg-muted" : "bg-transparent",
            !chat.readByAdmin && "bg-primary/10 border-primary/50"
          )}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 overflow-hidden">
                <p className={cn("font-semibold truncate", !chat.readByAdmin && "text-primary")}>
                    {chat.userName}
                </p>
                <p className="text-sm text-muted-foreground truncate">{chat.lastMessageSnippet}</p>
            </div>
            {chat.lastMessageAt?.toDate && (
                <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                    {formatDistanceToNow(chat.lastMessageAt.toDate(), { addSuffix: true })}
                </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
