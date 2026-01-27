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
    const { fileName, fileType, folder, subjectCode, submissionId } = body;

    if (!fileName || !fileType || !folder) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const tempSubmissionId = submissionId || `TEMP-${Date.now()}`;
    let key: string;

    if (folder === "admit-cards") {
      key = generateAdmitCardPath(tempSubmissionId, fileName);
    } else if (folder === "answer-sheets") {
      if (!subjectCode) {
        return NextResponse.json(
          { error: "Subject code required for answer sheets" },
          { status: 400 }
        );
      }
      key = generateAnswerSheetPath(tempSubmissionId, subjectCode, fileName);
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
