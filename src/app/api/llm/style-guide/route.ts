import { NextRequest, NextResponse } from "next/server";
import { generateLLMResponse, getAzureConfig } from "@/lib/llm/client";
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

    // Log config for debugging (without sensitive data)
    const config = getAzureConfig();
    console.log("Azure config:", {
      baseURL: config.baseURL,
      deployment: config.deployment,
    });

    const userPrompt = buildStyleGuidePrompt(modelContext);

    const styleGuide = await generateLLMResponse(
      DESIGNTOOLS_SYSTEM,
      userPrompt,
      { temperature: 0 }
    );

    return NextResponse.json({ styleGuide });
  } catch (error: unknown) {
    console.error("Error generating style guide:", error);
    // Include more details in error response
    const message = error instanceof Error ? error.message : "Unknown error";
    const details = error instanceof Error && "cause" in error ? String(error.cause) : undefined;
    return NextResponse.json({
      error: message,
      details,
      hint: "Check AZURE_OPENAI_DEPLOYMENT matches your deployment name exactly, and AZURE_OPENAI_ENDPOINT ends with /openai/v1"
    }, { status: 500 });
  }
}
