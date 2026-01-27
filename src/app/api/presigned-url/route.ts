import { NextRequest, NextResponse } from "next/server";
import { generatePresignedUploadUrl } from "@/lib/aws/s3";
import {
  generateAdmitCardPath,
  generateAnswerSheetPath,
  getMimeType,
} from "@/lib/utils/file-naming";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fileName,
      fileType,
      folder,
      subjectCode,
      studentName,
      mobileNumber,
      submissionType,
      imageIndex,
    } = body;

    if (!fileName || !fileType || !folder) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!studentName || !mobileNumber) {
      return NextResponse.json(
        { error: "Student name and mobile number are required" },
        { status: 400 }
      );
    }

    let key: string;

    if (folder === "admit-cards") {
      key = generateAdmitCardPath(studentName, mobileNumber, fileName);
    } else if (folder === "answer-sheets") {
      if (!subjectCode || !submissionType) {
        return NextResponse.json(
          { error: "Subject code and submission type required for answer sheets" },
          { status: 400 }
        );
      }
      key = generateAnswerSheetPath(
        studentName,
        mobileNumber,
        submissionType,
        subjectCode,
        fileName,
        imageIndex
      );
    } else {
      return NextResponse.json(
        { error: "Invalid folder" },
        { status: 400 }
      );
    }

    const contentType = fileType || getMimeType(fileName);
    const { uploadUrl, fileUrl } = await generatePresignedUploadUrl(key, contentType);

    return NextResponse.json({ uploadUrl, fileUrl });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
