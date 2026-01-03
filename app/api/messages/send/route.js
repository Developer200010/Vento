import { NextResponse } from "next/server";
import connectDB from "../../../../config/database";
import Message from "../../../../models/message";
import Chatroom from "../../../../models/chatRoom";
import User from "../../../../models/user";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    // ============================================
    // STEP 1: Check if user is logged in
    // ============================================
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Please login first" },
        { status: 401 }
      );
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // ============================================
    // STEP 2: Get message data from request
    // ============================================
    const { chatroomId, text } = await request.json();

    // Validate input
    if (!chatroomId || !text) {
      return NextResponse.json(
        { error: "Chatroom ID and message text are required" },
        { status: 400 }
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return NextResponse.json(
        { error: "Message too long (max 1000 characters)" },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 3: Check if chatroom exists and user is member
    // ============================================
    await connectDB();

    const chatroom = await Chatroom.findById(chatroomId);
    if (!chatroom) {
      return NextResponse.json(
        { error: "Chatroom not found" },
        { status: 404 }
      );
    }

    if (!chatroom.isActive) {
      return NextResponse.json(
        { error: "This chatroom is no longer active" },
        { status: 400 }
      );
    }

    // Check if user is a member
    const isMember = chatroom.members.some(
      (memberId) => memberId.toString() === userId
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "You must join this chatroom first" },
        { status: 403 }
      );
    }

    // ============================================
    // STEP 4: Get user's username
    // ============================================
    const user = await User.findById(userId).select("username");
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ============================================
    // STEP 5: Calculate expiration time (2 hours from now)
    // ============================================
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    // ============================================
    // STEP 6: Create message in database
    // ============================================
    const newMessage = await Message.create({
      chatroomId,
      userId,
      username: user.username,
      text: text.trim(),
      expiresAt,
    });

    // ============================================
    // STEP 7: Return success response
    // NOTE: Socket.io will broadcast the message
    // to all connected clients in real-time
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: {
          id: newMessage._id,
          text: newMessage.text,
          username: newMessage.username,
          userId: newMessage.userId,
          createdAt: newMessage.createdAt,
          expiresAt: newMessage.expiresAt,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}