import { NextRequest, NextResponse } from "next/server";
import { DesignJsonSchema } from "@/types/project";
import { buildReport } from "@/lib/ai/feasibility";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = DesignJsonSchema.safeParse(body.design ?? body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid design payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const report = buildReport(parsed.data);

    // In a later iteration we will:
    // 1. Call an LLM with the deterministic report + design for richer language
    // 2. Store the report in Supabase
    // 3. Optionally generate a PDF and return a signed URL

    return NextResponse.json(report);
  } catch (err) {
    console.error("help-me-build error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
