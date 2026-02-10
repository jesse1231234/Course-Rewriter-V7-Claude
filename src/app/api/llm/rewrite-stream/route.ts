import { NextRequest } from "next/server";
import { getAzureConfig } from "@/lib/llm/client";
import {
  DESIGNTOOLS_SYSTEM,
  buildRewritePrompt,
} from "@/config/designtools-system";

// Using Node.js runtime for better env variable support

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      item,
      globalInstructions = "",
      itemSpecificInstructions = "",
      modelStyleGuide = "",
      modelSignatureSnippets = "",
      preserveExistingDesignTools = false,
    } = body || {};

    if (!item || !item.html) {
      return new Response(JSON.stringify({ error: "Missing item or item.html" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!modelStyleGuide) {
      return new Response(JSON.stringify({ error: "Missing modelStyleGuide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { baseURL, apiKey, deployment, apiVersion } = getAzureConfig();

    // Build the rewrite prompt
    const userPrompt = buildRewritePrompt(
      item.html,
      item.title,
      item.kind,
      globalInstructions || "",
      itemSpecificInstructions || "",
      modelStyleGuide,
      modelSignatureSnippets || "",
      { preserveExistingDesignTools: preserveExistingDesignTools ?? false }
    );

    const url = `${baseURL}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: DESIGNTOOLS_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        temperature: 0,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `Azure OpenAI error: ${response.status} - ${errorText}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create a TransformStream to process the SSE response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                // Forward the content as SSE
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      },
    });

    // Pipe the response through our transform
    const readable = response.body?.pipeThrough(transformStream);

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("Error in streaming rewrite:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
