import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
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

  // If no admin phones configured, allow any authenticated user
  if (ADMIN_PHONES.length === 0) return true;

  return ADMIN_PHONES.includes(payload.phoneNumber);
}

// GET - List all teachers
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

    const result = await docClient.send(
      new ScanCommand({ TableName: TABLE_NAME })
    );

    const teachers = (result.Items || []) as Teacher[];

    // Sort by name
    teachers.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

// POST - Create new teacher
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { phoneNumber, name, languages, subjects } = body;

    // Validation
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number (must be 10 digits)" },
        { status: 400 }
      );
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name is required (min 2 characters)" },
        { status: 400 }
      );
    }

    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      return NextResponse.json(
        { error: "At least one language is required" },
        { status: 400 }
      );
    }

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json(
        { error: "At least one subject is required" },
        { status: 400 }
      );
    }

    // Check if teacher already exists
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { phoneNumber },
      })
    );

    if (existing.Item) {
      return NextResponse.json(
        { error: "Teacher with this phone number already exists" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const teacher: Teacher = {
      phoneNumber,
      name: name.trim(),
      languages: languages as MediumOfStudy[],
      subjects,
      isActive: true,
      pendingCount: 0,
      totalEvaluated: 0,
      onboardedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: teacher,
      })
    );

    return NextResponse.json({
      success: true,
      message: "Teacher created successfully",
      teacher,
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return NextResponse.json(
      { error: "Failed to create teacher" },
      { status: 500 }
    );
  }
}
