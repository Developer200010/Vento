import { NextResponse } from "next/server";
import connectDB from "../../../../../config/database";
import Chatroom from "../../../../../models/chatRoom";
import jwt from "jsonwebtoken";

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request, { params }) {
  try {
    // ============================================
    // STEP 1: Get chatroom ID from URL
    // ============================================
    const { id: chatroomId } = await params;

    // ============================================
    // STEP 2: Check if user is logged in
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
    // STEP 3: Get user's current location
    // ============================================
    const { latitude, longitude } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Location is required to join" },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 4: Find the chatroom in database
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

    // ============================================
    // STEP 5: Check if user already joined
    // ============================================
    const alreadyJoined = chatroom.members.some(
      (memberId) => memberId.toString() === userId
    );

    if (alreadyJoined) {
      return NextResponse.json(
        { 
          success: true,
          message: "You're already a member of this chatroom",
          chatroom: {
            id: chatroom._id,
            name: chatroom.name,
          }
        },
        { status: 200 }
      );
    }

    // ============================================
    // STEP 6: Check if user is within radius
    // ============================================
    const distance = calculateDistance(
      latitude,
      longitude,
      chatroom.location.latitude,
      chatroom.location.longitude
    );

    if (distance > chatroom.radius) {
      return NextResponse.json(
        { 
          error: `You're too far away! You're ${distance.toFixed(1)}km away, but need to be within ${chatroom.radius}km`,
          distance: distance.toFixed(1),
          requiredRadius: chatroom.radius
        },
        { status: 403 } // 403 = Forbidden
      );
    }

    // ============================================
    // STEP 7: Add user to chatroom members
    // ============================================
    chatroom.members.push(userId);
    await chatroom.save();

    // ============================================
    // STEP 8: Send success response
    // ============================================
    return NextResponse.json({
      success: true,
      message: `Successfully joined ${chatroom.name}!`,
      chatroom: {
        id: chatroom._id,
        name: chatroom.name,
        memberCount: chatroom.members.length,
      }
    });

  } catch (error) {
    console.error("Join chatroom error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}