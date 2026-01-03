import { createServer } from "http";
import { Server } from "socket.io";
import { parse } from "url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handler(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Create Socket.io server
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? false 
        : ["http://localhost:3000"],
      methods: ["GET", "POST"],
    },
  });

  // ============================================
  // SOCKET.IO EVENT HANDLERS
  // ============================================

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // ────────────────────────────────────────
    // JOIN CHATROOM
    // ────────────────────────────────────────
    socket.on("join-room", (chatroomId) => {
      socket.join(chatroomId);
      console.log(`👤 User ${socket.id} joined room: ${chatroomId}`);

      // Notify others in the room
      socket.to(chatroomId).emit("user-joined", {
        message: "Someone joined the chat",
      });
    });

    // ────────────────────────────────────────
    // LEAVE CHATROOM
    // ────────────────────────────────────────
    socket.on("leave-room", (chatroomId) => {
      socket.leave(chatroomId);
      console.log(`👋 User ${socket.id} left room: ${chatroomId}`);

      // Notify others in the room
      socket.to(chatroomId).emit("user-left", {
        message: "Someone left the chat",
      });
    });

    // ────────────────────────────────────────
    // NEW MESSAGE
    // ────────────────────────────────────────
    socket.on("send-message", (data) => {
      const { chatroomId, message } = data;
      
      console.log(`💬 Message in room ${chatroomId}:`, message.text);

      // Broadcast to everyone in the room (including sender)
      io.to(chatroomId).emit("new-message", message);
    });

    // ────────────────────────────────────────
    // TYPING INDICATOR
    // ────────────────────────────────────────
    socket.on("typing-start", (data) => {
      const { chatroomId, username } = data;
      
      // Tell others user is typing (not yourself)
      socket.to(chatroomId).emit("user-typing", { username });
    });

    socket.on("typing-stop", (data) => {
      const { chatroomId } = data;
      
      // Tell others user stopped typing
      socket.to(chatroomId).emit("user-stopped-typing");
    });

    // ────────────────────────────────────────
    // DISCONNECT
    // ────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  // ============================================
  // START SERVER
  // ============================================
  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});