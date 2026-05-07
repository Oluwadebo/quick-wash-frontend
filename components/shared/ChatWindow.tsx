import React from 'react';
import { Send, Image as ImageIcon, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { api, UserData } from '@/lib/ApiService';
import { cn } from '@/lib/utils';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  orderId?: string;
  senderId: string;
  senderName?: string;
  receiverId: string;
  senderRole: string;
  text: string;
  image?: string;
  createdAt: string;
}

interface ChatWindowProps {
  orderId?: string;
  recipientId?: string;
  currentUser: UserData;
  recipientName: string;
  onClose?: () => void;
}

export default function ChatWindow({ orderId, recipientId, currentUser, recipientName, onClose }: ChatWindowProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const socketRef = React.useRef<Socket | null>(null);

  const fetchMessages = React.useCallback(async () => {
    try {
      let msgs;
      if (orderId) {
        msgs = await api.getMessages(orderId);
      } else if (recipientId) {
        msgs = await api.getConversationMessages(currentUser.uid, recipientId);
      } else {
        msgs = [];
      }
      setMessages(msgs);
    } catch (err) {}
  }, [orderId, recipientId, currentUser.uid]);

  React.useEffect(() => {
    // Initial fetch
    fetchMessages();

    // Socket.io Setup
    const socketUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Chat] Connected to socket at ${socketUrl}`);
      if (orderId) {
        socket.emit("join_order", orderId);
      } else if (recipientId) {
        const conversationId = [currentUser.uid, recipientId].sort().join("_");
        socket.emit("join_conversation", conversationId);
      }
    });

    socket.on("new_message", (msg: Message) => {
      console.log("[Chat] Received new message:", msg);
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId, recipientId, currentUser.uid, fetchMessages]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !imagePreview) || isSending) return;

    setIsSending(true);
    
    // Create optimistic message
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      orderId,
      senderId: currentUser.uid,
      senderName: currentUser.fullName,
      receiverId: recipientId || '',
      senderRole: currentUser.role,
      text: inputText || (imagePreview ? 'Sent an image' : ''),
      image: imagePreview || undefined,
      createdAt: new Date().toISOString()
    };

    // Add optimistically
    setMessages(prev => [...prev, optimisticMessage]);
    const textToSend = inputText;
    setInputText('');
    setImagePreview(null);

    try {
      const msgData = {
        orderId,
        senderId: currentUser.uid,
        senderName: currentUser.fullName,
        receiverId: recipientId,
        receiverName: recipientName,
        senderRole: currentUser.role,
        text: textToSend || (optimisticMessage.image ? 'Sent an image' : ''),
        image: optimisticMessage.image
      };

      const newMessage = await api.sendMessage(msgData);
      
      if (newMessage && socketRef.current) {
        socketRef.current.emit("send_message", newMessage);
        // Replace temp message with real one to avoid duplicates later
        setMessages(prev => prev.map(m => m._id === optimisticMessage._id ? newMessage : m));
      }
    } catch (err) {
      console.error("[Chat] Send error:", err);
      // Remove optimistic message on error or show fail state
      setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
      alert("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface max-h-[600px] border border-primary/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-primary text-on-primary flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-on-primary/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-on-primary" />
          </div>
          <div>
            <h4 className="font-headline font-black text-sm">{recipientName}</h4>
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Order Chat #{orderId}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-on-primary/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-surface-container-lowest">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">No messages yet.<br/>Start the conversation below.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.uid;
          return (
            <div key={msg._id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm",
                isMe ? "bg-primary text-on-primary rounded-tr-none" : "bg-surface-container-high text-on-surface rounded-tl-none border border-primary/5"
              )}>
                {msg.image && (
                  <div className="relative w-full aspect-video rounded-lg mb-2 overflow-hidden shadow-sm">
                    <Image 
                      src={msg.image} 
                      alt="Message attachment" 
                      fill 
                      className="object-cover"
                      unoptimized={msg.image.startsWith('data:')}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant mt-1 px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.senderName || msg.senderRole}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-surface border-t border-primary/10">
        <AnimatePresence>
          {imagePreview && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative mb-4"
            >
              <div className="relative h-32 w-48 rounded-xl overflow-hidden border-2 border-primary">
                <Image 
                  src={imagePreview} 
                  alt="Preview" 
                  fill 
                  className="object-cover"
                  unoptimized={imagePreview.startsWith('data:')}
                />
              </div>
              <button 
                onClick={() => setImagePreview(null)}
                className="absolute -top-2 -left-2 bg-error text-white p-1 rounded-full shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleSend} className="flex gap-2">
          <label className="p-3 bg-surface-container-high rounded-2xl cursor-pointer hover:bg-surface-container-highest transition-colors flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-on-surface-variant" />
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-surface-container-high rounded-2xl px-4 text-sm font-medium outline-none focus:ring-2 ring-primary/20 transition-all"
          />
          <button 
            type="submit"
            disabled={isSending}
            className="p-3 bg-primary text-on-primary rounded-2xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
