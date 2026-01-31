import { NextRequest, NextResponse } from "next/server";
import { signToken, getCookieName, getCookieOptions } from "@/lib/auth/jwt";
import { getTeacherByPhone } from "@/lib/aws/teachers";

const EXTERNAL_AUTH_API_BASE =
  process.env.EXTERNAL_AUTH_API_BASE ||
  "https://platform-dev.arivihan.com/internal-metrics/auth";

interface ExternalVerifyResponse {
  success: boolean;
  message: string;
  status: number;
  data?: {
    accessToken: string;
    tokenType: string;
  };
  admin?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otp } = body;

    // Validate input
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number" },
        { status: 400 }
      );
    }

    if (!otp || !/^\d{4,6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP format" },
        { status: 400 }
      );
    }

    // Call external API to verify OTP
    const response = await fetch(`${EXTERNAL_AUTH_API_BASE}/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber, otp }),
    });

    const data: ExternalVerifyResponse = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: data.message || "Invalid OTP" },
        { status: response.status }
      );
    }

    // Check if user is a teacher
    let teacherInfo = null;
    try {
      const teacher = await getTeacherByPhone(phoneNumber);
      if (teacher && teacher.isActive) {
        teacherInfo = {
          isTeacher: true,
          teacherName: teacher.name,
          teacherSubjects: teacher.subjects,
          teacherLanguages: teacher.languages,
        };
      }
    } catch (error) {
      console.error("[Auth] Error checking teacher status:", error);
      // Don't fail auth if teacher check fails
    }

    // Create our own JWT token for the session (with teacher info if applicable)
    const token = await signToken(phoneNumber, teacherInfo || undefined);

    // Create response with cookie
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = getCookieOptions(isProduction);

    const res = NextResponse.json({
      success: true,
      message: "Authentication successful",
      isAdmin: data.admin || false,
      isTeacher: teacherInfo?.isTeacher || false,
      teacherName: teacherInfo?.teacherName,
    });

    res.cookies.set(getCookieName(), token, cookieOptions);

    return res;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify OTP. Please try again." },
      { status: 500 }
    );
  }
}
