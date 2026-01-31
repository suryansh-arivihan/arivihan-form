import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { verifyToken, getCookieName } from "@/lib/auth/jwt";
import { Teacher } from "@/types/teacher";
import { MediumOfStudy } from "@/types/form";

const client = new DynamoDBClient({
  region: process.env.APP_AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TEACHERS_TABLE || "arivihan-teachers";
const ADMIN_PHONES = process.env.ADMIN_PHONE_NUMBERS?.split(",") || [];

async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(getCookieName())?.value;
  if (!token) return false;

  const payload = await verifyToken(token);
  if (!payload) return false;

  if (ADMIN_PHONES.length === 0) return true;

  return ADMIN_PHONES.includes(payload.phoneNumber);
}

interface RouteParams {
  params: Promise<{ phone: string }>;
}

// GET - Get single teacher
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

    const { phone } = await params;

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { phoneNumber: phone },
      })
    );

    if (!result.Item) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      teacher: result.Item as Teacher,
    });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher" },
      { status: 500 }
    );
  }
}

// PUT - Update teacher
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

    const { phone } = await params;
    const body = await request.json();
    const { name, languages, subjects, isActive } = body;

    // Check if teacher exists
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { phoneNumber: phone },
      })
    );

    if (!existing.Item) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Build update expression
    const updateParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    if (name !== undefined) {
      updateParts.push("#name = :name");
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = name.trim();
    }

    if (languages !== undefined) {
      updateParts.push("languages = :languages");
      expressionAttributeValues[":languages"] = languages as MediumOfStudy[];
    }

    if (subjects !== undefined) {
      updateParts.push("subjects = :subjects");
      expressionAttributeValues[":subjects"] = subjects;
    }

    if (isActive !== undefined) {
      updateParts.push("isActive = :isActive");
      expressionAttributeValues[":isActive"] = isActive;
    }

    if (updateParts.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { phoneNumber: phone },
        UpdateExpression: "SET " + updateParts.join(", "),
        ExpressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    return NextResponse.json({
      success: true,
      message: "Teacher updated successfully",
      teacher: result.Attributes as Teacher,
    });
  } catch (error) {
    console.error("Error updating teacher:", error);
    return NextResponse.json(
      { error: "Failed to update teacher" },
      { status: 500 }
    );
  }
}

// DELETE - Delete teacher
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

    const { phone } = await params;

    // Check if teacher exists
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { phoneNumber: phone },
      })
    );

    if (!existing.Item) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const teacher = existing.Item as Teacher;

    // Warn if teacher has pending assignments
    if (teacher.pendingCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete teacher with pending assignments",
          pendingCount: teacher.pendingCount,
        },
        { status: 400 }
      );
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { phoneNumber: phone },
      })
    );

    return NextResponse.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json(
      { error: "Failed to delete teacher" },
      { status: 500 }
    );
  }
}
