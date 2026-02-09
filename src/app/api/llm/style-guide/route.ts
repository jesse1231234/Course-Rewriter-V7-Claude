import { NextRequest, NextResponse } from "next/server";
import { generateLLMResponse } from "@/lib/llm/client";
import { DESIGNTOOLS_SYSTEM, buildStyleGuidePrompt } from "@/config/designtools-system";

export async function POST(request: NextRequest) {
  try {
    const { modelContext } = await request.json();

    if (!modelContext) {
      return NextResponse.json(
        { error: "Missing modelContext" },
        { status: 400 }
      );
    }

    const userPrompt = buildStyleGuidePrompt(modelContext);

    const styleGuide = await generateLLMResponse(
      DESIGNTOOLS_SYSTEM,
      userPrompt,
      { temperature: 0 }
    );

    return NextResponse.json({ styleGuide });
  } catch (error: unknown) {
    console.error("Error generating style guide:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
