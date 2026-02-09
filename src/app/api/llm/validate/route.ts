import { NextRequest, NextResponse } from "next/server";
import { validateRewrite, detectModelStyleFlags } from "@/lib/validation/rules";

export async function POST(request: NextRequest) {
  try {
    const { originalHtml, rewrittenHtml, modelContext } = await request.json();

    if (!originalHtml || !rewrittenHtml) {
      return NextResponse.json(
        { error: "Missing originalHtml or rewrittenHtml" },
        { status: 400 }
      );
    }

    const flags = detectModelStyleFlags(modelContext || "");
    const violations = validateRewrite(originalHtml, rewrittenHtml, flags);

    return NextResponse.json({
      valid: violations.length === 0,
      violations,
    });
  } catch (error: unknown) {
    console.error("Error validating rewrite:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
