import { NextResponse } from "next/server";
import connectDB from "../../../../config/database";
import Chatroom from "../../../../models/chatRoom";
import jwt from "jsonwebtoken";
import { isAwaitExpression } from "typescript";

export async function GET(request, { params }) {
  try {
    const { id: chatroomId } =await params;

    // Check if user is logged in
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

    // Get chatroom from database
    await connectDB();
    
    const chatroom = await Chatroom.findById(chatroomId)
      .populate("createdBy", "username");

    if (!chatroom) {
      return NextResponse.json(
        { error: "Chatroom not found" },
        { status: 404 }
      );
    }

    // Check if user is a member
    const isMember = chatroom.members.some(
      (memberId) => memberId.toString() === userId
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "You're not a member of this chatroom" },
        { status: 403 }
      );
    }

    // Return chatroom details
    return NextResponse.json({
      success: true,
      chatroom: {
        id: chatroom._id,
        name: chatroom.name,
        radius: chatroom.radius,
        memberCount: chatroom.members.length,
        createdBy: chatroom.createdBy?.username || null,
        location: chatroom.location,
        createdAt: chatroom.createdAt,
      },
    });

  } catch (error) {
    console.error("Get chatroom error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}