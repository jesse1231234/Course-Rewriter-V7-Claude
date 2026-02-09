/**
 * DesignTools/DesignPLUS System Prompt for Canvas LMS HTML Transformation
 *
 * This prompt instructs the LLM to act as a deterministic HTML transformer
 * that applies model course styling while preserving original content.
 */

export const DESIGNTOOLS_SYSTEM = `You are a deterministic HTML transformer for Canvas DesignTools (DesignPLUS).
Your job is to restructure and style HTML content to match a model course's DesignTools patterns
while preserving ALL instructional text and media verbatim.

## Core Contract
- Apply model-course structure faithfully while preserving original content
- Output ONLY valid HTML - no markdown, no commentary, no explanations
- Never delete content; only restructure and wrap with DesignTools classes
- Preserve ALL URLs and Canvas attributes exactly as they appear

## Non-Negotiable Rules

### Output Format
- Return ONLY the transformed HTML
- No code fences, no markdown formatting
- No explanatory text before or after

### Content Preservation
- Keep all instructional text verbatim (unless user explicitly requests rewording)
- Preserve ALL URLs exactly: href, src, data-api-endpoint, etc.
- Keep all Canvas-specific attributes: id, class, data-*, title, target, rel, style
- Never modify iframe src attributes
- Never modify image src attributes
- Never modify link href attributes

### DesignTools Structure
- Wrapper: Exactly one <div id="dp-wrapper" class="dp-wrapper ...">
- Preserve all variant classes and data-* attributes from model
- Header: First child is <header class="dp-header"> with <h2 class="dp-heading">
- Use dp-header-pre and dp-header-title spans inside heading
- Sections: Use <div class="dp-content-block"> with data-title/data-category
- Icons: Use dp-has-icon pattern with hidden dp-icon-content span
- Embeds: Preserve iframe src EXACTLY; wrap in dp-embed-wrapper if model uses it
- Panels: Use dp-panels-wrapper with appropriate mode (tabs/accordion/expander)
- Callouts/Cards: Preserve dp-callout and card structures exactly

### Special Elements
- If original has dp-banner-image, preserve it
- If original has dp-module-progress-icons, preserve it
- If original has Canvas API endpoints (data-api-endpoint), preserve them exactly

## Style Guide Application
When given a style guide extracted from the model course:
1. Follow the structural patterns described
2. Use the same class combinations
3. Match the nesting hierarchy
4. Apply consistent spacing/formatting`;

/**
 * Build prompt for extracting style guide from model course samples
 */
export function buildStyleGuidePrompt(modelContext: string): string {
  return `Analyze the following HTML samples from a Canvas model course and extract a concise style guide
that describes the DesignTools/DesignPLUS patterns used.

Focus on:
1. Wrapper structure and variant classes
2. Header format (dp-header, dp-heading, pre/title spans)
3. Content block organization
4. Icon usage patterns
5. Panel modes (tabs, accordion, expander)
6. Embed wrapper usage
7. Callout/card structures
8. Any consistent class combinations

Be concise but thorough. This style guide will be used to transform other content to match this style.

---

MODEL COURSE SAMPLES:

${modelContext}

---

Extract a style guide describing the DesignTools patterns observed:`;
}

export interface RewritePromptOptions {
  preserveExistingDesignTools?: boolean;
}

/**
 * Build prompt for rewriting a single item
 */
export function buildRewritePrompt(
  originalHtml: string,
  title: string,
  kind: string,
  globalInstructions: string,
  itemSpecificInstructions: string,
  modelStyleGuide: string,
  modelSignatureSnippets: string,
  options: RewritePromptOptions = {}
): string {
  const { preserveExistingDesignTools = false } = options;

  let prompt = `Transform the following ${kind} titled "${title}" to match the model course style.

## Style Guide
${modelStyleGuide}

## Signature Snippets (structural examples)
${modelSignatureSnippets}
`;

  // Add preserve mode instructions if enabled
  if (preserveExistingDesignTools) {
    prompt += `
## Preserve Mode (IMPORTANT)
The original content may already have some DesignTools/DesignPLUS styling.
- PRESERVE all existing dp-* structures that are correct and match the model style
- Only ADD missing DesignTools patterns where the content lacks styling
- Do NOT restructure sections that already have proper dp-content-block wrappers
- Do NOT change existing dp-header structures if they match the model pattern
- Focus on enhancing unstyled areas rather than rebuilding styled ones
- If content is already fully styled to match the model, return it with minimal changes
`;
  } else {
    prompt += `
## Full Transform Mode
Completely restructure the content to match the model course style.
- Apply the model's DesignTools patterns throughout
- Reorganize content structure as needed to match model patterns
- Ensure consistent styling from start to finish
`;
  }

  if (globalInstructions) {
    prompt += `\n## Global Instructions\n${globalInstructions}\n`;
  }

  if (itemSpecificInstructions) {
    prompt += `\n## Item-Specific Instructions\n${itemSpecificInstructions}\n`;
  }

  prompt += `\n---\n\nORIGINAL HTML TO TRANSFORM:\n\n${originalHtml}\n\n---\n\nOutput the transformed HTML only:`;

  return prompt;
}

/**
 * Build prompt for repairing a failed rewrite
 */
export function buildRepairPrompt(
  rewrittenHtml: string,
  violations: string[]
): string {
  return `The following HTML has validation errors. Fix ONLY these specific issues:

VIOLATIONS:
${violations.map((v, i) => `${i + 1}. ${v}`).join("\n")}

Do not change anything else. Output only the corrected HTML.

---

HTML TO FIX:

${rewrittenHtml}

---

Output the corrected HTML only:`;
}
