/**
 * DesignPLUS (Cidi Labs) Precise HTML Pattern Templates
 *
 * These templates provide exact HTML structures based on real DesignPLUS output.
 * The LLM must follow these patterns exactly.
 */

// ============================================================
// THEME CONFIGURATION
// ============================================================

// Theme class applied to dp-wrapper AND dp-header
export const THEME_CLASS = "dp-flat-sections variation-2";

// Data attributes for dp-wrapper (these match what DesignPLUS generates)
export const WRAPPER_DATA_ATTRIBUTES = {
  "data-header-class": "dp-header dp-flat-sections variation-2",
  "data-nav-class": "container-fluid dp-link-grid dp-flat-sections variation-2 dp-fs-2",
  "data-img-url": "https://designtools.ciditools.com/css/images/banner_desert_sky.png",
};

// ============================================================
// BASE WRAPPER TEMPLATE
// ============================================================

export const WRAPPER_TEMPLATE = `
<div id="dp-wrapper" class="dp-wrapper dp-flat-sections variation-2" data-header-class="dp-header dp-flat-sections variation-2" data-nav-class="container-fluid dp-link-grid dp-flat-sections variation-2 dp-fs-2" data-img-url="https://designtools.ciditools.com/css/images/banner_desert_sky.png">
  {{CONTENT}}
</div>
`.trim();

// ============================================================
// HEADER TEMPLATE
// ============================================================

export const HEADER_TEMPLATE = `
<header class="dp-header dp-flat-sections variation-2">
    <h2 class="dp-heading">
        <span class="dp-header-pre">
            <span class="dp-header-pre-1">{{PRE_TEXT_1}}</span>
            <span class="dp-header-pre-2">{{PRE_TEXT_2}}</span>
        </span>
        <span class="dp-header-title">{{TITLE}}</span>
    </h2>
</header>
`.trim();

// ============================================================
// CONTENT BLOCK TEMPLATES
// ============================================================

export const CONTENT_BLOCK_TEMPLATE = `
<div class="dp-content-block">
    {{CONTENT}}
</div>
`.trim();

export const CONTENT_BLOCK_WITH_METADATA_TEMPLATE = `
<div class="dp-content-block" data-title="{{TITLE}}" data-category="{{CATEGORY}}">
    {{CONTENT}}
</div>
`.trim();

// ============================================================
// HEADING WITH ICON TEMPLATE
// ============================================================

// Icon is INSIDE the h3, uses dp-icon class with fas (Font Awesome Solid)
// Has hidden dp-icon-content span inside the <i> tag
export const HEADING_WITH_ICON_TEMPLATE = `
<h3 class="dp-has-icon">
    <i class="dp-icon fas fa-{{ICON}}" aria-hidden="true">
        <span class="dp-icon-content" style="display: none;">&nbsp;</span>
    </i>
    {{HEADING_TEXT}}
</h3>
`.trim();

// ============================================================
// CALLOUT TEMPLATE (Bootstrap Card-based)
// ============================================================

export const CALLOUT_TEMPLATE = `
<div class="dp-callout dp-callout-placeholder card dp-callout-position-default dp-callout-type-{{TYPE}} dp-callout-color-dp-primary">
    <div class="dp-callout-side-emphasis">
        <i class="dp-icon fas fa-{{ICON}} dp-default-icon">
            <span class="dp-icon-content" style="display: none;">&nbsp;</span>
        </i>
    </div>
    <div class="card-body">
        <h3 class="card-title">{{TITLE}}</h3>
        <p class="card-text">{{CONTENT}}</p>
    </div>
</div>
`.trim();

// Callout types and their icons
export const CALLOUT_TYPES = {
  info: { icon: "info-circle", label: "Information" },
  tip: { icon: "lightbulb", label: "Tip" },
  warning: { icon: "exclamation-triangle", label: "Warning" },
  note: { icon: "sticky-note", label: "Note" },
  important: { icon: "exclamation-circle", label: "Important" },
} as const;

// ============================================================
// EMBED WRAPPER TEMPLATE (for iframes/videos)
// ============================================================

export const EMBED_WRAPPER_TEMPLATE = `
<div class="dp-embed-wrapper">
    {{IFRAME}}
</div>
`.trim();

// With responsive scaling
export const EMBED_WRAPPER_RESPONSIVE_TEMPLATE = `
<div class="dp-embed-wrapper dp-embed-fill-width dp-embed-scale-proportionally">
    {{IFRAME}}
</div>
`.trim();

// ============================================================
// ACCORDION TEMPLATE (for collapsible content with videos)
// ============================================================

// Accordion wrapper - uses dp-accordion-default class
export const ACCORDION_WRAPPER_TEMPLATE = `
<div class="dp-panels-wrapper dp-accordion-default">
    {{PANELS}}
</div>
`.trim();

// Individual accordion panel
export const ACCORDION_PANEL_TEMPLATE = `
<div class="dp-panel-group">
    <h4 class="dp-panel-heading">{{PANEL_TITLE}}</h4>
    <div class="dp-panel-content">
        {{PANEL_CONTENT}}
    </div>
</div>
`.trim();

// Accordion panel with video
export const ACCORDION_VIDEO_PANEL_TEMPLATE = `
<div class="dp-panel-group">
    <h4 class="dp-panel-heading">{{PANEL_TITLE}}</h4>
    <div class="dp-panel-content">
        <div class="dp-embed-wrapper">
            {{IFRAME}}
        </div>
    </div>
</div>
`.trim();

// ============================================================
// TABS TEMPLATE (horizontal tabs)
// ============================================================

export const TABS_WRAPPER_TEMPLATE = `
<div class="dp-panels-wrapper dp-tabs-buttons">
    {{PANELS}}
</div>
`.trim();

export const TAB_PANEL_TEMPLATE = `
<div class="dp-panel-group">
    <h3 class="dp-panel-heading">{{TAB_TITLE}}</h3>
    <div class="dp-panel-content">
        {{TAB_CONTENT}}
    </div>
</div>
`.trim();

// ============================================================
// VERTICAL TABS / VIDEO PLAYLIST TEMPLATE
// ============================================================

export const VERTICAL_TABS_WRAPPER_TEMPLATE = `
<div class="dp-panels-wrapper dp-panel-active-color-dp-primary dp-panel-hover-color-mid dp-panel-color-dp-primary dp-tabs-buttons-vertical">
    {{PANELS}}
</div>
`.trim();

export const VERTICAL_TAB_VIDEO_PANEL_TEMPLATE = `
<div class="dp-panel-group">
    <h3 class="dp-panel-heading dp-has-icon d-flex align-items-center dp-shadow-r1">
        {{PANEL_TITLE}}
        <i class="far fa-play-circle dp-i-size-large m-2">
            <span class="dp-icon-content" style="display: none;">&nbsp;</span>
        </i>
    </h3>
    <div class="dp-panel-content">
        <div class="dp-embed-wrapper">
            {{IFRAME}}
        </div>
    </div>
</div>
`.trim();

// ============================================================
// ICON REFERENCE (Font Awesome 5 - fas = solid, far = regular)
// ============================================================

export const COMMON_ICONS = {
  // Section types
  overview: "align-justify",
  objectives: "bullseye",
  check: "check",
  readings: "book",
  "readings-open": "book-open",
  lectures: "chalkboard-teacher",
  videos: "photo-video",
  assignments: "file-alt",
  edit: "edit",

  // Callout types
  info: "info-circle",
  warning: "exclamation-triangle",
  tip: "lightbulb",
  note: "sticky-note",
  important: "exclamation-circle",

  // Media
  video: "video",
  "play-circle": "play-circle", // Use with "far" not "fas"
  image: "image",
  file: "file",

  // Actions
  download: "download",
  link: "external-link-alt",
  calendar: "calendar",
} as const;

// ============================================================
// REWRITE OPTIONS INTERFACE
// ============================================================

export interface DesignToolsRewriteOptions {
  // Theme (currently only dp-flat-sections variation-2 is documented)
  theme: string;

  // Iframe handling
  wrapIframesInAccordion: boolean;
  iframeAccordionLabel: string;

  // Content enhancement
  enhanceWrittenContent: boolean;
  addCallouts: boolean;
  calloutDetection: "auto" | "manual";

  // Image handling
  frameImages: boolean;
  addImageCaptions: boolean;

  // Structure
  useIconHeaders: boolean;
  organizeIntoSections: boolean;

  // Accessibility
  fixHeadingHierarchy: boolean;
  addAltText: boolean;
}

export const DEFAULT_REWRITE_OPTIONS: DesignToolsRewriteOptions = {
  theme: "dp-flat-sections variation-2",
  wrapIframesInAccordion: false,
  iframeAccordionLabel: "Click to view video",
  enhanceWrittenContent: false,
  addCallouts: false,
  calloutDetection: "auto",
  frameImages: false,
  addImageCaptions: false,
  useIconHeaders: true,
  organizeIntoSections: true,
  fixHeadingHierarchy: true,
  addAltText: false,
};

// For backwards compatibility with existing code
export const THEME_VARIANTS = {
  default: "dp-flat-sections variation-2",
} as const;

export type ThemeVariant = keyof typeof THEME_VARIANTS;

// ============================================================
// BUILD PATTERN INSTRUCTIONS FROM OPTIONS
// ============================================================

export function buildPatternInstructionsFromOptions(
  options: DesignToolsRewriteOptions
): string {
  const instructions: string[] = [];

  // Iframe accordion wrapping
  if (options.wrapIframesInAccordion) {
    instructions.push(`## Iframe Accordion Wrapping (REQUIRED)
EVERY iframe MUST be wrapped in an accordion panel. This is a strict requirement.

For EACH iframe found, use this EXACT structure:
\`\`\`html
<div class="dp-panels-wrapper dp-accordion-default">
    <div class="dp-panel-group">
        <h4 class="dp-panel-heading">${options.iframeAccordionLabel}</h4>
        <div class="dp-panel-content">
            <div class="dp-embed-wrapper">
                [PRESERVE EXACT ORIGINAL IFRAME WITH ALL ATTRIBUTES]
            </div>
        </div>
    </div>
</div>
\`\`\`

CRITICAL:
- Preserve the EXACT original iframe with ALL its attributes (src, title, class, style, width, height, allow, loading, etc.)
- Use unique panel titles for multiple iframes (e.g., "Video 1", "Video 2" or use the iframe title attribute)
- The dp-embed-wrapper ensures responsive sizing`);
  }

  // Callouts
  if (options.addCallouts) {
    instructions.push(`## Callout Boxes
Wrap important information, tips, warnings, and notes in callout boxes.

Detection mode: ${options.calloutDetection === "auto" ? "Automatically detect content that should be in callouts" : "Only wrap content explicitly marked"}

Use this EXACT structure:
\`\`\`html
<div class="dp-callout dp-callout-placeholder card dp-callout-position-default dp-callout-type-info dp-callout-color-dp-primary">
    <div class="dp-callout-side-emphasis">
        <i class="dp-icon fas fa-info-circle dp-default-icon">
            <span class="dp-icon-content" style="display: none;">&nbsp;</span>
        </i>
    </div>
    <div class="card-body">
        <h3 class="card-title">[CALLOUT TITLE]</h3>
        <p class="card-text">[CALLOUT CONTENT]</p>
    </div>
</div>
\`\`\`

Types (change dp-callout-type-X and the icon):
- info: fa-info-circle
- tip: fa-lightbulb
- warning: fa-exclamation-triangle
- note: fa-sticky-note`);
  }

  // Content enhancement
  if (options.enhanceWrittenContent) {
    instructions.push(`## Content Enhancement
Improve the readability and clarity of written content:
- Fix obvious grammar and spelling errors
- Improve sentence structure for clarity
- Break up very long paragraphs
- Ensure consistent formatting
- DO NOT change the meaning or remove any information`);
  }

  // Icon headers
  if (options.useIconHeaders) {
    instructions.push(`## Icon Headers
Add icons to section headings based on content type.

Use this EXACT structure:
\`\`\`html
<h3 class="dp-has-icon">
    <i class="dp-icon fas fa-[ICON]" aria-hidden="true">
        <span class="dp-icon-content" style="display: none;">&nbsp;</span>
    </i>
    [HEADING TEXT]
</h3>
\`\`\`

Icon guide (use "fas" prefix for all):
- Overview: fa-align-justify
- Objectives: fa-bullseye or fa-check
- Readings: fa-book or fa-book-open
- Lectures/Videos: fa-chalkboard-teacher or fa-photo-video
- Assignments: fa-file-alt or fa-edit
- Assessments: fa-file-alt`);
  }

  // Heading hierarchy
  if (options.fixHeadingHierarchy) {
    instructions.push(`## Heading Hierarchy (Accessibility)
Ensure proper heading structure:
- H2: Only inside dp-heading (page title in header)
- H3: Major section headings (with dp-has-icon if using icons)
- H4: Subsections and accordion panel headings
- NEVER skip heading levels (e.g., H2 to H4 is invalid)`);
  }

  return instructions.join("\n\n");
}
