import { createAzure } from "@ai-sdk/azure";
import { generateText, streamText } from "ai";

/**
 * Get Azure OpenAI client configuration
 */
export function getAzureConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

  if (!endpoint || !apiKey) {
    throw new Error(
      "Missing Azure OpenAI configuration. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables."
    );
  }

  // Normalize endpoint - remove trailing slash if present
  const baseURL = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;

  return {
    baseURL,
    apiKey,
    deployment,
  };
}

/**
 * Create Azure OpenAI provider
 * Note: API version is read from AZURE_API_VERSION env var automatically by the SDK
 */
export function createAzureProvider() {
  const { baseURL, apiKey } = getAzureConfig();

  return createAzure({
    baseURL,
    apiKey,
  });
}

/**
 * Generate text response from Azure OpenAI
 */
export async function generateLLMResponse(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number } = {}
): Promise<string> {
  const azure = createAzureProvider();
  const { deployment } = getAzureConfig();
  const model = azure(deployment);

  const result = await generateText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: options.temperature ?? 0,
  });

  return result.text;
}

/**
 * Stream text response from Azure OpenAI
 */
export async function streamLLMResponse(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number } = {}
) {
  const azure = createAzureProvider();
  const { deployment } = getAzureConfig();
  const model = azure(deployment);

  const result = streamText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: options.temperature ?? 0,
  });

  return result;
}

/**
 * Normalize LLM HTML output - strip code fences and trim
 */
export function normalizeHtml(text: string): string {
  let html = text.trim();

  // Remove markdown code fences if present
  if (html.startsWith("```html")) {
    html = html.slice(7);
  } else if (html.startsWith("```")) {
    html = html.slice(3);
  }

  if (html.endsWith("```")) {
    html = html.slice(0, -3);
  }

  return html.trim();
}
