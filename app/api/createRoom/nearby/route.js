import { NextResponse } from "next/server";
import connectDB from "../../../../config/database";
import Chatroom from "../../../../models/chatRoom"
import jwt from "jsonwebtoken";

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

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
    // STEP 2: Get user's current location
    // ============================================
    const { latitude, longitude } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 3: Get all active chatrooms from database
    // ============================================
    await connectDB();
    
    const allChatrooms = await Chatroom.find({ isActive: true })
      .populate({ path: "createdBy", select: "username", options: { strictPopulate: false } }) // Get creator's username (allow missing)
      .sort({ createdAt: -1 }); // Newest first

    // ============================================
    // STEP 4: Filter chatrooms within user's reach
    // ============================================
    const nearbyChatrooms = [];

    for (const room of allChatrooms) {
      // Calculate distance from user to this chatroom
      const distance = calculateDistance(
        latitude,
        longitude,
        room.location.latitude,
        room.location.longitude
      );

      // Is user within this chatroom's radius?
      if (distance <= room.radius) {
        nearbyChatrooms.push({
          id: room._id,
          name: room.name,
          radius: room.radius,
          distance: distance.toFixed(1), // Round to 1 decimal (e.g., 0.5 km)
          memberCount: room.members.length,
          createdBy: room.createdBy?.username || "Unknown",
          isJoined: room.members?.some((m) => m?.toString?.() === String(userId)), // Check if user already joined
          location: room.location,
          createdAt: room.createdAt,
        });
      }
    }

    // ============================================
    // STEP 5: Send response
    // ============================================
    return NextResponse.json({
      success: true,
      chatrooms: nearbyChatrooms,
      count: nearbyChatrooms.length,
      userLocation: { latitude, longitude },
    });

  } catch (error) {
    console.error("Get nearby chatrooms error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}