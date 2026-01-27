import { NextRequest, NextResponse } from "next/server";
import { getSubmissionQuota, generateStudentId } from "@/lib/aws/dynamodb";

export async function POST(request: NextRequest) {
  try {
    // Check if AWS credentials are configured
    if (!process.env.APP_AWS_ACCESS_KEY_ID || !process.env.APP_AWS_SECRET_ACCESS_KEY) {
      console.error("AWS credentials not configured");
      return NextResponse.json(
        { error: "Server configuration error: AWS credentials missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { studentName, mobileNumber } = body;

    if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
      return NextResponse.json(
        { error: "Invalid mobile number" },
        { status: 400 }
      );
    }

    if (!studentName || studentName.trim().length < 2) {
      return NextResponse.json(
        { error: "Invalid student name" },
        { status: 400 }
      );
    }

    const quota = await getSubmissionQuota(studentName, mobileNumber);
    const studentId = generateStudentId(studentName, mobileNumber);

    return NextResponse.json({
      studentId,
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to check submission quota: ${errorMessage}` },
      { status: 500 }
    );
  }
}
