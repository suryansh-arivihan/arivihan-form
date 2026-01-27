import { NextRequest, NextResponse } from "next/server";
import { scanAllSubmissions } from "@/lib/aws/dynamodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const lastKeyParam = searchParams.get("lastKey");

    let lastEvaluatedKey: Record<string, unknown> | undefined;
    if (lastKeyParam) {
      try {
        lastEvaluatedKey = JSON.parse(decodeURIComponent(lastKeyParam));
      } catch {
        return NextResponse.json(
          { error: "Invalid lastKey parameter" },
          { status: 400 }
        );
      }
    }

    const result = await scanAllSubmissions(limit, lastEvaluatedKey);

    return NextResponse.json({
      submissions: result.items,
      nextKey: result.lastEvaluatedKey
        ? encodeURIComponent(JSON.stringify(result.lastEvaluatedKey))
        : null,
      scanned: result.totalScanned,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
