import connectDB from "../../../../config/database";
import User from "../../../../models/user";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function DELETE(request) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await User.findByIdAndDelete(decoded.userId);

    const response = NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );

    response.cookies.set("token", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
