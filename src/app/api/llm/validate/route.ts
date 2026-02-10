import { NextRequest, NextResponse } from "next/server";
import { validateRewrite, detectModelStyleFlags } from "@/lib/validation/rules";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const originalHtml = body?.originalHtml || "";
    const rewrittenHtml = body?.rewrittenHtml || "";
    const modelContext = body?.modelContext || "";

    // If either is empty, just return valid (no violations to check)
    if (!originalHtml.trim() || !rewrittenHtml.trim()) {
      return NextResponse.json({
        valid: true,
        violations: [],
      });
    }

    const flags = detectModelStyleFlags(modelContext);
    const violations = validateRewrite(originalHtml, rewrittenHtml, flags);

    return NextResponse.json({
      valid: violations.length === 0,
      violations,
    });
  } catch (error: unknown) {
    console.error("Error validating rewrite:", error);
    // Return valid on error to not block the rewrite
    return NextResponse.json({
      valid: true,
      violations: [],
    });
  }
}
