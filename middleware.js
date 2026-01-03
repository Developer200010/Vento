import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function verifyJWT(token) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return jwtVerify(token, secret);
}

export async function middleware(request) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  try {
    const { payload } = await verifyJWT(token);
    const res = NextResponse.next();
    if (payload?.userId) {
      res.headers.set("x-user-id", String(payload.userId));
    }
    return res;
  } catch (e) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/room/:path*",
    "/api/messages/:path*",
    "/api/createRoom/:path*",
    "/api/user/:path*",
  ],
};
