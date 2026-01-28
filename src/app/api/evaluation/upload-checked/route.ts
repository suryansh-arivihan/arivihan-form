import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const studentId = formData.get("studentId") as string | null;
    const subjectCode = formData.get("subjectCode") as string | null;
    const submissionType = formData.get("submissionType") as string | null;

    if (!file || !studentId || !subjectCode || !submissionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const submissionFolder =
      submissionType === "arivihan_model_paper"
        ? "arivihan-model-paper"
        : "own-question-paper";

    const key = `${studentId}/${submissionFolder}/${subjectCode}/answer_sheet_checked.pdf`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
    });

    await s3Client.send(command);

    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.APP_AWS_REGION || "ap-south-1"}.amazonaws.com/${key}`;

    return NextResponse.json({ success: true, fileUrl, key });
  } catch (error) {
    console.error("Error uploading checked PDF:", error);
    return NextResponse.json(
      { error: "Failed to upload PDF" },
      { status: 500 }
    );
  }
}
