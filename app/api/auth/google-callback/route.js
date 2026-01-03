import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    // Read NextAuth JWT (contains userId set in callbacks.jwt)
    const nextAuthToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = nextAuthToken?.userId;
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in?error=auth_failed", request.url));
    }

    // Create the SAME JWT token as your password login
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set the SAME cookie as your password login
    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    const isSecure = (new URL(request.url).protocol || "").startsWith("https");
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(new URL("/sign-in?error=server_error", request.url));
  }
}
