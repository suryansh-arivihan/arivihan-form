import { NextRequest, NextResponse } from "next/server";
import { updateSubjectMarks } from "@/lib/aws/dynamodb";
import { SubmissionType } from "@/types/form";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, subjectCode, submissionType, marksObtained, marksTotal } = body;

    if (!studentId || !subjectCode || !submissionType) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, subjectCode, submissionType" },
        { status: 400 }
      );
    }

    if (marksObtained === undefined || marksTotal === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: marksObtained, marksTotal" },
        { status: 400 }
      );
    }

    const marksObtainedNum = parseInt(marksObtained, 10);
    const marksTotalNum = parseInt(marksTotal, 10);

    if (isNaN(marksObtainedNum) || isNaN(marksTotalNum)) {
      return NextResponse.json(
        { error: "Marks must be valid numbers" },
        { status: 400 }
      );
    }

    if (marksObtainedNum < 0 || marksTotalNum <= 0) {
      return NextResponse.json(
        { error: "Invalid marks values" },
        { status: 400 }
      );
    }

    if (marksObtainedNum > marksTotalNum) {
      return NextResponse.json(
        { error: "Marks obtained cannot be greater than total marks" },
        { status: 400 }
      );
    }

    const updatedRecord = await updateSubjectMarks(
      studentId,
      submissionType as SubmissionType,
      subjectCode,
      marksObtainedNum,
      marksTotalNum
    );

    if (!updatedRecord) {
      return NextResponse.json(
        { error: "Failed to update marks. Student or subject not found, or paper not yet checked." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, updatedRecord });
  } catch (error) {
    console.error("Error updating marks:", error);
    return NextResponse.json(
      { error: "Failed to update marks" },
      { status: 500 }
    );
  }
}
