import { NextRequest, NextResponse } from "next/server";

const EXTERNAL_AUTH_API_BASE =
  process.env.EXTERNAL_AUTH_API_BASE ||
  "https://platform-dev.arivihan.com/internal-metrics/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    // Validate phone number - must be 10 digits
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number. Must be 10 digits." },
        { status: 400 }
      );
    }

    // Call external API to send OTP
    const response = await fetch(`${EXTERNAL_AUTH_API_BASE}/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to send OTP" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
