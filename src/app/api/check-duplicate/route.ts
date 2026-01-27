import { NextRequest, NextResponse } from "next/server";
import { getSubmissionQuota } from "@/lib/aws/dynamodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobileNumber } = body;

    if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
      return NextResponse.json(
        { error: "Invalid mobile number" },
        { status: 400 }
      );
    }

    const quota = await getSubmissionQuota(mobileNumber);

    return NextResponse.json({
      quota: {
        arivihanSubjectsUsed: quota.arivihanSubjectsUsed,
        ownSubjectsUsed: quota.ownSubjectsUsed,
        arivihanRemaining: quota.arivihanRemaining,
        ownRemaining: quota.ownRemaining,
      },
      isArivihanExhausted: quota.arivihanRemaining === 0,
      isOwnExhausted: quota.ownRemaining === 0,
      isFullyExhausted: quota.arivihanRemaining === 0 && quota.ownRemaining === 0,
    });
  } catch (error) {
    console.error("Error checking quota:", error);
    return NextResponse.json(
      { error: "Failed to check submission quota" },
      { status: 500 }
    );
  }
}
