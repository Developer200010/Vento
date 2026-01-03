import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(request) {
  try {
    const cookie = request.cookies.get("token");
    const token = cookie?.value || null;

    const result = {
      hasTokenCookie: Boolean(token),
      tokenLength: token?.length || 0,
      nodeEnv: process.env.NODE_ENV || null,
      jwtSecretPresent: Boolean(process.env.JWT_SECRET),
    };

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload, protectedHeader } = await jwtVerify(token, secret);
        result.verified = true;
        result.payload = payload;
        result.protectedHeader = protectedHeader;
      } catch (e) {
        result.verified = false;
        result.verifyError = e?.message || String(e);
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
