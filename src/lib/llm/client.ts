/**
 * Get Azure OpenAI client configuration
 */
export function getAzureConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
  const apiVersion = process.env.AZURE_API_VERSION || "2024-12-01-preview";

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
    apiVersion,
  };
}

interface AzureOpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Generate text response from Azure OpenAI using REST API directly
 */
export async function generateLLMResponse(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number } = {}
): Promise<string> {
  const { baseURL, apiKey, deployment, apiVersion } = getAzureConfig();

  const url = `${baseURL}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  console.log("Azure OpenAI request URL:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: options.temperature ?? 0,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Azure OpenAI error response:", errorText);
    throw new Error(`Azure OpenAI error: ${response.status} - ${errorText}`);
  }

  const data: AzureOpenAIResponse = await response.json();

  if (data.error) {
    throw new Error(`Azure OpenAI error: ${data.error.code} - ${data.error.message}`);
  }

  return data.choices[0]?.message?.content || "";
}

/**
 * Stream text response from Azure OpenAI (simplified non-streaming for now)
 */
export async function streamLLMResponse(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number } = {}
) {
  // For simplicity, just return the full response
  // Can implement true streaming later if needed
  const text = await generateLLMResponse(systemPrompt, userPrompt, options);
  return { text };
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
