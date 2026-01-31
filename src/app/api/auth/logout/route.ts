import { NextResponse } from "next/server";
import { getCookieName } from "@/lib/auth/jwt";

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Clear the auth cookie
  res.cookies.set(getCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  return res;
}
