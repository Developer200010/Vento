"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chatroom...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900 text-xl"
              >
                ←
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {chatroom?.name}
                </h1>
                <p className="text-xs text-gray-500">
                  👥 {chatroom?.memberCount} members • ⚡ Real-time
                </p>
              </div>
            </div>

            <button
              onClick={handleLeaveRoom}
              className="text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-md hover:bg-red-50 transition"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-600">Be the first to say something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Expiration Warning */}
            {messages.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <p className="text-sm text-yellow-800">
                  ⏱️ Messages expire in{" "}
                  <strong>{getTimeUntilExpiration()}</strong>
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.isOwn
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        msg.isOwn ? "text-blue-100" : "text-gray-900"
                      }`}
                    >
                      {msg.isOwn ? "You" : msg.username}
                    </span>
                    <span
                      className={`text-xs ${
                        msg.isOwn ? "text-blue-200" : "text-gray-500"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      msg.isOwn ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 px-4 py-2 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {typingUser} is typing
                    <span className="animate-pulse">...</span>
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Message Input */}
      <footer className="bg-white border-t sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            ⚡ Real-time messaging • Messages expire after 2 hours
          </p>
        </div>
      </footer>
    </div>
  );
}