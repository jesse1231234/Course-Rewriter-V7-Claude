import { createAzure } from "@ai-sdk/azure";
import { generateText, streamText } from "ai";

/**
 * Extract resource name from Azure OpenAI endpoint URL
 */
function extractResourceName(endpoint: string): string {
  // https://your-resource.openai.azure.com -> your-resource
  const match = endpoint.match(/https:\/\/([^.]+)\.openai\.azure\.com/);
  return match ? match[1] : "";
}

/**
 * Get Azure OpenAI client configuration
 */
export function getAzureConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";

  if (!endpoint || !apiKey) {
    throw new Error(
      "Missing Azure OpenAI configuration. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables."
    );
  }

  const resourceName = extractResourceName(endpoint);

  if (!resourceName) {
    throw new Error(
      "Invalid AZURE_OPENAI_ENDPOINT format. Expected: https://your-resource.openai.azure.com"
    );
  }

  return {
    resourceName,
    apiKey,
    deployment,
    apiVersion,
  };
}

/**
 * Create Azure OpenAI provider
 */
export function createAzureProvider() {
  const { resourceName, apiKey, apiVersion } = getAzureConfig();

  return createAzure({
    resourceName,
    apiKey,
    apiVersion,
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
