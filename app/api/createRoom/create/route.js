import { NextResponse } from "next/server";
import connectDB from "../../../../config/database";
import Chatroom from "../../../../models/chatRoom";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    // ============================================
    // STEP 1: Connect to Database
    // ============================================
    await connectDB();

    // ============================================
    // STEP 2: Check if User is Logged In
    // ============================================
    
    // Get JWT token from cookie
    const token = request.cookies.get("token")?.value;

    // No token? User is not logged in
    if (!token) {
      return NextResponse.json(
        { error: "Please login to create a chatroom" },
        { status: 401 } // 401 = Unauthorized
      );
    }

    // Verify the token and extract userId
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired session. Please login again" },
        { status: 401 }
      );
    }

    // ============================================
    // STEP 3: Get Data from Request Body
    // ============================================
    
    const { name, latitude, longitude, radius } = await request.json();

    // ============================================
    // STEP 4: Validate the Data
    // ============================================
    
    // Check if all required fields are provided
    if (!name || !latitude || !longitude || !radius) {
      return NextResponse.json(
        { error: "All fields are required (name, latitude, longitude, radius)" },
        { status: 400 } // 400 = Bad Request
      );
    }

    // Validate name length
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      return NextResponse.json(
        { error: "Chatroom name must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Chatroom name cannot exceed 100 characters" },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: "Invalid latitude. Must be between -90 and 90" },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Invalid longitude. Must be between -180 and 180" },
        { status: 400 }
      );
    }

    // Validate radius
    const radiusNum = parseFloat(radius);
    if (isNaN(radiusNum) || radiusNum < 0.1 || radiusNum > 100) {
      return NextResponse.json(
        { error: "Radius must be between 0.1 and 100 km" },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 5: Create the Chatroom in Database
    // ============================================
    
    const newChatroom = await Chatroom.create({
      name: trimmedName,
      location: {
        latitude: latitude,
        longitude: longitude,
      },
      radius: radiusNum,
      createdBy: userId,
      members: [userId], // Creator automatically joins as first member
      isActive: true,
    });

    // ============================================
    // STEP 6: Send Success Response
    // ============================================
    
    return NextResponse.json(
      {
        success: true,
        message: "Chatroom created successfully",
        chatroom: {
          id: newChatroom._id,
          name: newChatroom.name,
          location: newChatroom.location,
          radius: newChatroom.radius,
          createdBy: newChatroom.createdBy,
          memberCount: newChatroom.members.length,
          createdAt: newChatroom.createdAt,
        },
      },
      { status: 201 } // 201 = Created
    );

  } catch (error) {
    // ============================================
    // STEP 7: Handle Any Errors
    // ============================================
    
    console.error("Create chatroom error:", error);

    // Check if it's a validation error from Mongoose
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // For any other unexpected errors
    return NextResponse.json(
      { error: "Something went wrong. Please try again" },
      { status: 500 } // 500 = Internal Server Error
    );
  }
}