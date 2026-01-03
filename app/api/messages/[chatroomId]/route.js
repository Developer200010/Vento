import { NextResponse } from "next/server";
import connectDB from "../../../../config/database";
import Message from "../../../../models/message";
import Chatroom from "../../../../models/chatRoom";
import jwt from "jsonwebtoken";

export async function GET(request, { params }) {
  try {
    const { chatroomId } = await params;

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
    // STEP 2: Check if chatroom exists and user is member
    // ============================================
    await connectDB();

    const chatroom = await Chatroom.findById(chatroomId);
    if (!chatroom) {
      return NextResponse.json(
        { error: "Chatroom not found" },
        { status: 404 }
      );
    }

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
    // STEP 3: Get all non-expired messages from this chatroom
    // ============================================
    const now = new Date();
    
    const messages = await Message.find({
      chatroomId,
      expiresAt: { $gt: now }, // Only get messages that haven't expired
    })
      .sort({ createdAt: 1 }) // Oldest first (ascending order)
      .limit(100); // Limit to last 100 messages

    // ============================================
    // STEP 4: Format messages for frontend
    // ============================================
    const formattedMessages = messages.map((msg) => ({
      id: msg._id,
      text: msg.text,
      username: msg.username,
      userId: msg.userId,
      createdAt: msg.createdAt,
      expiresAt: msg.expiresAt,
      isOwn: msg.userId.toString() === userId, // Is this message from current user?
    }));

    // ============================================
    // STEP 5: Return messages
    // ============================================
    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length,
    });

  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}