/**
 * DesignTools/DesignPLUS System Prompt for Canvas LMS HTML Transformation
 *
 * This prompt instructs the LLM to act as a deterministic HTML transformer
 * that applies model course styling while preserving original content.
 */

export const DESIGNTOOLS_SYSTEM = `You are a precise HTML transformer for Canvas DesignPLUS (Cidi Labs).
Your job is to apply EXACT DesignPLUS HTML patterns while preserving all original content.

## CRITICAL: Output Rules
- Return ONLY the transformed HTML - no code fences, no markdown, no explanations
- Every output MUST start with: <div id="dp-wrapper" class="dp-wrapper dp-flat-sections variation-2"
- Every output MUST end with: </div> (closing the dp-wrapper)

## CRITICAL: Content Preservation
- NEVER modify iframe elements - copy the ENTIRE iframe tag with ALL its attributes EXACTLY
- NEVER modify image src attributes - copy them EXACTLY
- NEVER modify href attributes - copy them EXACTLY
- NEVER modify data-api-endpoint attributes - copy them EXACTLY
- Keep ALL Canvas attributes: id, class, data-*, title, target, rel, style
- Preserve all instructional text verbatim

## Required DesignPLUS Structure

### Base Wrapper (REQUIRED)
Every output must have exactly ONE wrapper with these exact classes and data attributes:
<div id="dp-wrapper" class="dp-wrapper dp-flat-sections variation-2" data-header-class="dp-header dp-flat-sections variation-2" data-nav-class="container-fluid dp-link-grid dp-flat-sections variation-2 dp-fs-2" data-img-url="https://designtools.ciditools.com/css/images/banner_desert_sky.png">
  [ALL CONTENT HERE]
</div>

### Header (REQUIRED as first child)
<header class="dp-header dp-flat-sections variation-2">
    <h2 class="dp-heading">
        <span class="dp-header-pre">
            <span class="dp-header-pre-1">[Pre-text word, e.g., "Module"]</span>
            <span class="dp-header-pre-2">[Pre-text number, e.g., "1"]</span>
        </span>
        <span class="dp-header-title">[Main Title]</span>
    </h2>
</header>

### Content Blocks
<div class="dp-content-block">
    [Section content]
</div>
Or with metadata:
<div class="dp-content-block" data-title="[Section Name]" data-category="Instructional">
    [Section content]
</div>

### Section Headings with Icons
Icon is INSIDE the h3, uses dp-icon class with "fas" (Font Awesome Solid):
<h3 class="dp-has-icon">
    <i class="dp-icon fas fa-[icon]" aria-hidden="true">
        <span class="dp-icon-content" style="display: none;">&nbsp;</span>
    </i>
    [Heading Text]
</h3>

### Responsive Embed Wrapper (for iframes/videos)
<div class="dp-embed-wrapper">
    [EXACT ORIGINAL IFRAME WITH ALL ATTRIBUTES]
</div>

### Accordion (for collapsible content)
<div class="dp-panels-wrapper dp-accordion-default">
    <div class="dp-panel-group">
        <h4 class="dp-panel-heading">[Panel Title]</h4>
        <div class="dp-panel-content">
            [Panel Content - wrap iframes in dp-embed-wrapper]
        </div>
    </div>
</div>

### Tabs (horizontal)
<div class="dp-panels-wrapper dp-tabs-buttons">
    <div class="dp-panel-group">
        <h3 class="dp-panel-heading">[Tab Title]</h3>
        <div class="dp-panel-content">
            [Tab Content]
        </div>
    </div>
</div>

### Callout Box (Bootstrap Card-based)
<div class="dp-callout dp-callout-placeholder card dp-callout-position-default dp-callout-type-info dp-callout-color-dp-primary">
    <div class="dp-callout-side-emphasis">
        <i class="dp-icon fas fa-info-circle dp-default-icon">
            <span class="dp-icon-content" style="display: none;">&nbsp;</span>
        </i>
    </div>
    <div class="card-body">
        <h3 class="card-title">[Callout Title]</h3>
        <p class="card-text">[Callout Content]</p>
    </div>
</div>
Types: info (fa-info-circle), tip (fa-lightbulb), warning (fa-exclamation-triangle), note (fa-sticky-note)

## Icon Reference (Font Awesome 5 - use "fas" prefix)
- Overview: fas fa-align-justify
- Objectives: fas fa-bullseye OR fas fa-check
- Readings: fas fa-book OR fas fa-book-open
- Lectures/Videos: fas fa-chalkboard-teacher OR fas fa-photo-video
- Assignments: fas fa-file-alt OR fas fa-edit
- Info: fas fa-info-circle
- Warning: fas fa-exclamation-triangle
- Tip: fas fa-lightbulb

## Heading Hierarchy (Accessibility)
- H2: Only inside dp-heading (page title in header)
- H3: Major section headings (with dp-has-icon) and tab panel headings
- H4: Subsections and accordion panel headings
- NEVER skip levels (e.g., H2 to H4 is invalid)`;

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

import {
  buildPatternInstructionsFromOptions,
  type DesignToolsRewriteOptions,
  THEME_VARIANTS,
} from "./designtools-html-patterns";

export interface RewritePromptOptions {
  preserveExistingDesignTools?: boolean;
  designToolsOptions?: Partial<DesignToolsRewriteOptions>;
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
  const { preserveExistingDesignTools = false, designToolsOptions } = options;

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

  // Add DesignTools formatting options if provided
  if (designToolsOptions) {
    const fullOptions: DesignToolsRewriteOptions = {
      theme: (designToolsOptions.theme as keyof typeof THEME_VARIANTS) || "default",
      wrapIframesInAccordion: designToolsOptions.wrapIframesInAccordion ?? false,
      iframeAccordionLabel: designToolsOptions.iframeAccordionLabel ?? "Click to view video",
      enhanceWrittenContent: designToolsOptions.enhanceWrittenContent ?? false,
      addCallouts: designToolsOptions.addCallouts ?? false,
      calloutDetection: designToolsOptions.calloutDetection ?? "auto",
      frameImages: designToolsOptions.frameImages ?? false,
      addImageCaptions: designToolsOptions.addImageCaptions ?? false,
      useIconHeaders: designToolsOptions.useIconHeaders ?? true,
      organizeIntoSections: designToolsOptions.organizeIntoSections ?? true,
      fixHeadingHierarchy: designToolsOptions.fixHeadingHierarchy ?? true,
      addAltText: designToolsOptions.addAltText ?? false,
    };

    const patternInstructions = buildPatternInstructionsFromOptions(fullOptions);
    if (patternInstructions) {
      prompt += `\n${patternInstructions}\n`;
    }
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
