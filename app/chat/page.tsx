'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import BottomNav from '@/components/shared/BottomNav';
import { MessageSquare, Search, ChevronRight, User, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api, UserData } from '@/lib/ApiService';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import ChatWindow from '@/components/shared/ChatWindow';
import { cn } from '@/lib/utils';
import { io, Socket } from 'socket.io-client';

import Sidebar from '@/components/shared/Sidebar';

export default function GlobalChatPage() {
  const { user: authUser } = useAuth();
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [user, setUser] = React.useState<UserData | null>(null);
  const [selectedRecipient, setSelectedRecipient] = React.useState<{ id: string, name: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const socketRef = React.useRef<Socket | null>(null);

  const fetchConversations = React.useCallback(async () => {
    if (!authUser?.uid) return;
    try {
      const convs = await api.getConversations(authUser.uid);
      setConversations(convs);
    } catch (err) {
      console.error('[Chat] Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.uid]);

  React.useEffect(() => {
    if (authUser?.uid) {
      api.getUser(authUser.uid).then(setUser);
      fetchConversations();

      // Socket setup for real-time list updates
      const socketUrl = typeof window !== 'undefined' ? window.location.origin : '';

      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("[ChatList] Connected to socket");
        if (authUser?.uid) {
          socket.emit("join_user", authUser.uid);
        }
      });

      socket.on("new_message", (msg) => {
        console.log("[ChatList] Received new message event:", msg);
        // Refresh the list when any new message arrives involved in the user
        fetchConversations();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [authUser?.uid, fetchConversations]);

  // Join rooms for all conversations to get real-time updates
  React.useEffect(() => {
    if (socketRef.current && conversations.length > 0 && authUser?.uid) {
      conversations.forEach(conv => {
        const conversationId = [authUser.uid, conv.otherUserId].sort().join("_");
        socketRef.current?.emit("join_conversation", conversationId);
      });
    }
  }, [conversations, authUser?.uid]);

  const filteredConversations = conversations.filter(c => 
    c.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherUserId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 pb-32">
          <TopAppBar />
          
          <main className="pt-8 px-6 max-w-2xl mx-auto w-full">
          <header className="mb-10">
            <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter mb-2">Messages</h1>
            <p className="text-on-surface-variant font-medium">Chat with vendors, riders, and support.</p>
          </header>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input 
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low h-14 rounded-2xl pl-12 pr-4 text-sm font-medium outline-none border border-primary/5 focus:ring-2 ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 text-center opacity-50">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">Loading Chats...</p>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv, idx) => (
                <motion.button
                  key={conv.otherUserId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedRecipient({ id: conv.otherUserId, name: conv.otherUserName })}
                  className="w-full text-left bg-surface-container-low p-6 rounded-3xl border border-primary/5 hover:border-primary/20 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <User className="w-7 h-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-headline font-black text-on-surface mb-1">
                        {conv.otherUserName}
                      </h4>
                      <p className="text-xs font-medium text-on-surface-variant line-clamp-1 truncate">
                        {conv.lastMessage.text}
                      </p>
                      <span className="text-[8px] font-black uppercase tracking-widest text-outline mt-1 block">
                        {conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                </motion.button>
              ))
            ) : (

              <div className="py-20 text-center bg-surface-container-low rounded-[3rem] border border-dashed border-primary/20">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-primary/20" />
                </div>
                <h4 className="font-headline font-black text-on-surface">No conversations yet</h4>
                <p className="text-xs font-medium text-on-surface-variant mt-1">
                  Start a chat from an order tracking page.
                </p>
              </div>
            )}
          </div>
        </main>

        <AnimatePresence>
          {selectedRecipient && user && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedRecipient(null)}
                className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl border border-primary/10 overflow-hidden"
              >
                <div className="h-[600px]">
                  <ChatWindow 
                    recipientId={selectedRecipient.id} 
                    currentUser={user} 
                    recipientName={selectedRecipient.name}
                    onClose={() => setSelectedRecipient(null)}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <BottomNav />
        </div>
      </div>
    </ProtectedRoute>
  );
}
