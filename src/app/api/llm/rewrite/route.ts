import { NextRequest, NextResponse } from "next/server";
import { generateLLMResponse, normalizeHtml } from "@/lib/llm/client";
import {
  DESIGNTOOLS_SYSTEM,
  buildRewritePrompt,
  buildRepairPrompt,
} from "@/config/designtools-system";
import { validateRewrite, detectModelStyleFlags } from "@/lib/validation/rules";

export async function POST(request: NextRequest) {
  try {
    const {
      item,
      globalInstructions,
      itemSpecificInstructions,
      modelStyleGuide,
      modelSignatureSnippets,
      modelContextForFlags,
      preserveExistingDesignTools,
      designToolsOptions,
    } = await request.json();

    if (!item || !item.html) {
      return NextResponse.json(
        { error: "Missing item or item.html" },
        { status: 400 }
      );
    }

    if (!modelStyleGuide) {
      return NextResponse.json(
        { error: "Missing modelStyleGuide" },
        { status: 400 }
      );
    }

    // Build the rewrite prompt
    const userPrompt = buildRewritePrompt(
      item.html,
      item.title,
      item.kind,
      globalInstructions || "",
      itemSpecificInstructions || "",
      modelStyleGuide,
      modelSignatureSnippets || "",
      {
        preserveExistingDesignTools: preserveExistingDesignTools ?? false,
        designToolsOptions: designToolsOptions || undefined,
      }
    );

    // First pass: rewrite
    let rewrittenHtml = await generateLLMResponse(
      DESIGNTOOLS_SYSTEM,
      userPrompt,
      { temperature: 0 }
    );

    rewrittenHtml = normalizeHtml(rewrittenHtml);

    // Validate
    const flags = detectModelStyleFlags(modelContextForFlags || modelStyleGuide);
    let violations = validateRewrite(item.html, rewrittenHtml, flags);

    // If violations, attempt repair
    if (violations.length > 0) {
      const repairPrompt = buildRepairPrompt(rewrittenHtml, violations);

      let repairedHtml = await generateLLMResponse(
        DESIGNTOOLS_SYSTEM,
        repairPrompt,
        { temperature: 0 }
      );

      repairedHtml = normalizeHtml(repairedHtml);

      // Re-validate
      const newViolations = validateRewrite(item.html, repairedHtml, flags);

      if (newViolations.length < violations.length) {
        // Repair improved things
        rewrittenHtml = repairedHtml;
        violations = newViolations;
      }
    }

    return NextResponse.json({
      rewrittenHtml,
      violations,
    });
  } catch (error: unknown) {
    console.error("Error rewriting item:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
