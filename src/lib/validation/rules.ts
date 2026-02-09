import type { ValidationRule, StyleFlags } from "@/types";

// Regex patterns for extraction
const IFRAME_SRC_RE = /<iframe\b[^>]*\bsrc=['"]([^'"]+)['"][^>]*>/gi;
const CANVAS_API_ENDPOINT_RE = /data-api-endpoint=['"]([^'"]+)['"]/gi;

/**
 * Extract all iframe src values from HTML
 */
function extractIframeSrcs(html: string): string[] {
  const srcs: string[] = [];
  let match;
  const re = new RegExp(IFRAME_SRC_RE.source, "gi");
  while ((match = re.exec(html)) !== null) {
    srcs.push(match[1]);
  }
  return srcs;
}

/**
 * Extract all Canvas API endpoints from HTML
 */
function extractApiEndpoints(html: string): string[] {
  const endpoints: string[] = [];
  let match;
  const re = new RegExp(CANVAS_API_ENDPOINT_RE.source, "gi");
  while ((match = re.exec(html)) !== null) {
    endpoints.push(match[1]);
  }
  return endpoints;
}

/**
 * Validation rules for DesignTools HTML compliance
 */
export const validationRules: ValidationRule[] = [
  {
    id: "dp-wrapper-count",
    name: "Single dp-wrapper",
    description: 'Output must contain exactly one id="dp-wrapper" wrapper',
    validate: (original, rewritten, flags) => {
      const count = (rewritten.match(/id="dp-wrapper"/g) || []).length;
      if (count !== 1) {
        return `Output must contain exactly one id="dp-wrapper" wrapper (found ${count}).`;
      }
      return null;
    },
  },
  {
    id: "dp-header-structure",
    name: "Header structure",
    description: "Must have header with dp-header and dp-heading classes",
    validate: (original, rewritten, flags) => {
      // Only validate if original had DesignTools structure or we expect it
      const hasHeader = rewritten.includes("<header");
      const hasDpHeader = rewritten.includes("dp-header");
      const hasDpHeading = rewritten.includes("dp-heading");

      if (!hasHeader || !hasDpHeader || !hasDpHeading) {
        return "Missing required DesignTools header structure (dp-header/dp-heading).";
      }
      return null;
    },
  },
  {
    id: "iframe-preservation",
    name: "Iframe preservation",
    description: "All original iframe srcs must be preserved",
    validate: (original, rewritten, flags) => {
      const originalSrcs = extractIframeSrcs(original);
      if (originalSrcs.length === 0) return null;

      const missing = originalSrcs.filter((src) => !rewritten.includes(src));
      if (missing.length > 0) {
        return `Missing original iframe src: ${missing[0]}`;
      }
      return null;
    },
  },
  {
    id: "embed-wrapper",
    name: "Embed wrapper requirement",
    description: "If model uses dp-embed-wrapper, all iframes must be wrapped",
    validate: (original, rewritten, flags) => {
      if (!flags.requireEmbedWrapper) return null;

      const originalIframeCount = (original.match(/<iframe/gi) || []).length;
      if (originalIframeCount === 0) return null;

      const wrapperCount = (rewritten.match(/dp-embed-wrapper/gi) || []).length;
      if (wrapperCount < originalIframeCount) {
        return "Model style requires dp-embed-wrapper around iframes; output lacks enough wrappers.";
      }
      return null;
    },
  },
  {
    id: "api-endpoint-preservation",
    name: "API endpoint preservation",
    description: "All original Canvas data-api-endpoint attributes must be preserved",
    validate: (original, rewritten, flags) => {
      const originalEndpoints = extractApiEndpoints(original);
      if (originalEndpoints.length === 0) return null;

      const missing = originalEndpoints.filter((ep) => !rewritten.includes(ep));
      if (missing.length > 0) {
        return `Missing original data-api-endpoint: ${missing[0]}`;
      }
      return null;
    },
  },
  {
    id: "banner-image",
    name: "Banner image preservation",
    description: "If original had dp-banner-image, it must be in output",
    validate: (original, rewritten, flags) => {
      if (original.includes("dp-banner-image") && !rewritten.includes("dp-banner-image")) {
        return "Missing dp-banner-image block that existed in the original.";
      }
      return null;
    },
  },
  {
    id: "progress-icons",
    name: "Progress icons preservation",
    description: "If original had dp-module-progress-icons, it must be in output",
    validate: (original, rewritten, flags) => {
      if (
        original.includes("dp-module-progress-icons") &&
        !rewritten.includes("dp-module-progress-icons")
      ) {
        return "Missing dp-module-progress-icons placeholder that existed in the original.";
      }
      return null;
    },
  },
];

/**
 * Run all validation rules against rewritten HTML
 */
export function validateRewrite(
  original: string,
  rewritten: string,
  flags: StyleFlags
): string[] {
  return validationRules
    .map((rule) => rule.validate(original, rewritten, flags))
    .filter((violation): violation is string => violation !== null);
}

/**
 * Detect style flags from model context
 */
export function detectModelStyleFlags(modelContext: string): StyleFlags {
  return {
    requireEmbedWrapper: modelContext.includes("dp-embed-wrapper"),
  };
}

/**
 * Check if HTML content already has proper DesignTools styling
 * Returns styled status, confidence score (0-1), and reasons
 */
export function isAlreadyStyled(
  html: string,
  flags: StyleFlags
): { styled: boolean; confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  let maxScore = 4;

  // Check for dp-wrapper
  if (html.includes('id="dp-wrapper"')) {
    score += 1;
    reasons.push("Has dp-wrapper");
  }

  // Check for dp-header structure
  if (html.includes("dp-header") && html.includes("dp-heading")) {
    score += 1;
    reasons.push("Has header structure");
  }

  // Check for dp-content-block
  if (html.includes("dp-content-block")) {
    score += 1;
    reasons.push("Has content blocks");
  }

  // Check for embed wrapper if required
  if (flags.requireEmbedWrapper) {
    maxScore += 1;
    const iframeCount = (html.match(/<iframe/gi) || []).length;
    const wrapperCount = (html.match(/dp-embed-wrapper/gi) || []).length;
    if (iframeCount === 0 || wrapperCount >= iframeCount) {
      score += 1;
      reasons.push("Embed wrappers present");
    }
  }

  // Check for any dp- classes (indicates some styling)
  const dpClassCount = (html.match(/dp-[\w-]+/g) || []).length;
  if (dpClassCount >= 5) {
    score += 1;
    reasons.push(`Has ${dpClassCount} dp- classes`);
  }

  const confidence = score / maxScore;
  return {
    styled: confidence >= 0.6, // 60% threshold
    confidence,
    reasons,
  };
}
