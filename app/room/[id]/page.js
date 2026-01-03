"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import AppShell from "@/components/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

let socket;

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id;

  const [chatroom, setChatroom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ============================================
  // SOCKET.IO CONNECTION
  // ============================================
  useEffect(() => {
    // Initialize socket connection
    socketInitializer();

    return () => {
      // Cleanup: disconnect socket when leaving page
      if (socket) {
        socket.emit("leave-room", roomId);
        socket.disconnect();
      }
    };
  }, [roomId]);

  const socketInitializer = async () => {
    // Connect to Socket.io server
    socket = io();

    socket.on("connect", () => {
      console.log("✅ Connected to Socket.io server");
      
      // Join this specific chatroom
      socket.emit("join-room", roomId);
    });

    // Listen for new messages
    socket.on("new-message", (message) => {
      console.log("📩 New message received:", message);
      
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    // Listen for typing indicators
    socket.on("user-typing", ({ username }) => {
      if (username !== currentUsername) {
        setTypingUser(username);
        setIsTyping(true);
      }
    });

    socket.on("user-stopped-typing", () => {
      setIsTyping(false);
      setTypingUser("");
    });

    // Connection errors
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });
  };

  // ============================================
  // FETCH INITIAL DATA
  // ============================================
  useEffect(() => {
    fetchChatroomDetails();
    fetchMessages();
    fetchCurrentUser();
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/user/me");
      const data = await res.json();
      if (res.ok) {
        setCurrentUsername(data.user.username);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const fetchChatroomDetails = async () => {
    try {
      const res = await fetch(`/api/createRoom/${roomId}`);
      const data = await res.json();

      if (res.ok) {
        setChatroom(data.chatroom);
      } else {
        setError(data.error || "Failed to load chatroom");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${roomId}`);
      const data = await res.json();

      if (res.ok) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  // ============================================
  // SEND MESSAGE (with Socket.io)
  // ============================================
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSending(true);

    // Stop typing indicator
    socket.emit("typing-stop", { chatroomId: roomId });

    try {
      // Save to database
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatroomId: roomId,
          text: newMessage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Broadcast via Socket.io
        socket.emit("send-message", {
          chatroomId: roomId,
          message: {
            ...data.message,
            isOwn: true,
          },
        });

        setNewMessage(""); // Clear input
      } else {
        alert(data.error || "Failed to send message");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setSending(false);
    }
  };

  // ============================================
  // TYPING INDICATOR
  // ============================================
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // Emit typing event
    if (socket && e.target.value.length > 0) {
      socket.emit("typing-start", {
        chatroomId: roomId,
        username: currentUsername,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing-stop", { chatroomId: roomId });
      }, 2000);
    }
  };

  const handleLeaveRoom = () => {
    if (confirm("Are you sure you want to leave this chatroom?")) {
      if (socket) {
        socket.emit("leave-room", roomId);
        socket.disconnect();
      }
      router.push("/dashboard");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeUntilExpiration = () => {
    if (messages.length === 0) return null;

    const oldestMessage = messages[0];
    const expiresAt = new Date(oldestMessage.expiresAt);
    const now = new Date();
    const diffMs = expiresAt - now;

    if (diffMs <= 0) return "Expired";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center text-neutral-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4">Loading chatroom...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-neutral-100 mb-2">Error</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <AppShell
        title={
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="text-neutral-400 hover:text-neutral-200 text-xl">←</button>
            <div>
              <div className="text-lg font-semibold">{chatroom?.name}</div>
              <p className="text-xs text-neutral-400">👥 {chatroom?.memberCount} members • ⚡ Real-time</p>
            </div>
          </div>
        }
        right={<Button variant="danger" size="sm" onClick={handleLeaveRoom}>Leave</Button>}
      >
        {/* Messages Area */}
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
            <p className="text-neutral-400">Be the first to say something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Expiration Warning */}
            {messages.length > 0 && (
              <Card className="border-yellow-900/40 bg-yellow-950/40 p-3 text-center">
                <p className="text-sm text-yellow-300">
                  ⏱️ Messages expire in <strong>{getTimeUntilExpiration()}</strong>
                </p>
              </Card>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.isOwn ? "bg-emerald-600 text-white" : "bg-neutral-900 border border-neutral-800"}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-semibold ${msg.isOwn ? "text-emerald-100" : "text-neutral-200"}`}>
                      {msg.isOwn ? "You" : msg.username}
                    </span>
                    <span className={`text-xs ${msg.isOwn ? "text-emerald-100/70" : "text-neutral-500"}`}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm ${msg.isOwn ? "text-white" : "text-neutral-200"}`}>{msg.text}</p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-neutral-800 px-4 py-2 rounded-lg">
                  <p className="text-sm text-neutral-300">
                    {typingUser} is typing
                    <span className="animate-pulse">...</span>
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Message Input */}
        <footer className="border-t border-neutral-800 sticky bottom-0 bg-neutral-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 placeholder-neutral-500 text-neutral-100"
                disabled={sending}
                maxLength={1000}
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                {sending ? "..." : "Send"}
              </Button>
            </form>
            <p className="text-xs text-neutral-500 mt-2 text-center">⚡ Real-time messaging • Messages expire after 2 hours</p>
          </div>
        </footer>
      </AppShell>
    </div>
  );
}