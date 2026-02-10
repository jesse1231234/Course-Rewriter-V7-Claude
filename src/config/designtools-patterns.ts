/**
 * DesignTools Quick Apply Patterns
 *
 * These are pre-defined instructions that can be toggled on/off
 * and appended to global instructions during rewrite.
 */

export interface DesignToolsPattern {
  id: string;
  name: string;
  description: string;
  instruction: string;
}

export const DESIGNTOOLS_PATTERNS: DesignToolsPattern[] = [
  {
    id: "icon-headers",
    name: "Icon Headers",
    description: "Add icons to section headings",
    instruction: `Add the dp-has-icon pattern to content block headings where appropriate.
Use relevant Font Awesome icons based on the section content:
- Learning objectives: fa-bullseye
- Reading: fa-book
- Videos: fa-video
- Activities: fa-tasks
- Discussions: fa-comments
- Quizzes/Assessments: fa-question-circle
- Resources: fa-folder-open
Structure: <h3 class="dp-has-icon"><span class="dp-icon-content" aria-hidden="true"><i class="fa fa-[icon]"></i></span> Title</h3>`,
  },
  {
    id: "tabs-layout",
    name: "Tabs Layout",
    description: "Convert related sections into tabs",
    instruction: `When content has 2-5 related parallel sections (like "Read", "Watch", "Practice"),
wrap them in dp-panels-wrapper with tabs mode.
Structure:
<div class="dp-panels-wrapper" data-mode="tabs">
  <button class="dp-panel-button" data-panel="panel-1">Tab 1</button>
  ...
  <div class="dp-panel" id="panel-1">Content 1</div>
  ...
</div>
Only use tabs when content is truly parallel/alternative, not sequential.`,
  },
  {
    id: "accordion-layout",
    name: "Accordion Layout",
    description: "Convert long sections to collapsible accordion",
    instruction: `For long pages with many sections, use dp-panels-wrapper with accordion mode
to keep content organized and reduce scroll fatigue.
Structure:
<div class="dp-panels-wrapper" data-mode="accordion">
  <button class="dp-panel-button" data-panel="section-1">Section Title</button>
  <div class="dp-panel" id="section-1">Section content...</div>
  ...
</div>
Keep each section focused on one topic.`,
  },
  {
    id: "callout-boxes",
    name: "Callout Boxes",
    description: "Highlight key information with callouts",
    instruction: `Wrap important information, tips, warnings, or notes in dp-callout components.
Types to use:
- dp-callout-info: General important information
- dp-callout-tip: Helpful tips and best practices
- dp-callout-warning: Warnings or cautions
- dp-callout-note: Side notes or additional context
Structure: <div class="dp-callout dp-callout-[type]"><p>Content</p></div>`,
  },
  {
    id: "columns-layout",
    name: "Responsive Columns",
    description: "Use side-by-side columns where appropriate",
    instruction: `Use dp-columns for content that benefits from side-by-side presentation:
- Image with text description
- Two related concepts to compare
- Steps with accompanying visuals
Structure:
<div class="dp-columns">
  <div class="dp-column">Column 1 content</div>
  <div class="dp-column">Column 2 content</div>
</div>
Columns stack on mobile automatically.`,
  },
  {
    id: "embed-wrappers",
    name: "Embed Wrappers",
    description: "Wrap videos and embeds properly",
    instruction: `Wrap all iframes and embedded content in dp-embed-wrapper for responsive sizing.
Structure:
<div class="dp-embed-wrapper">
  <iframe src="..." ...></iframe>
</div>
This ensures videos and embeds resize properly on all devices.`,
  },
  {
    id: "cards-grid",
    name: "Cards Grid",
    description: "Present items as visual cards",
    instruction: `For lists of resources, links, or options, present them as a card grid.
Structure:
<div class="dp-cards-grid">
  <div class="dp-card">
    <div class="dp-card-header">Title</div>
    <div class="dp-card-body">Description</div>
  </div>
  ...
</div>
Good for resource lists, module overviews, or option selections.`,
  },
  {
    id: "fix-headings",
    name: "Fix Heading Order",
    description: "Correct accessibility heading hierarchy",
    instruction: `Ensure headings follow proper accessibility hierarchy:
- Page title uses H2 in dp-heading
- Major sections use H3
- Subsections use H4
- Never skip heading levels (e.g., H2 to H4)
- Don't use headings just for bold text - use <strong> instead
- Every heading should meaningfully describe its section content`,
  },
];

/**
 * Build additional instructions from selected patterns
 */
export function buildPatternInstructions(patternIds: string[]): string {
  if (patternIds.length === 0) return "";

  const selectedPatterns = DESIGNTOOLS_PATTERNS.filter((p) =>
    patternIds.includes(p.id)
  );

  if (selectedPatterns.length === 0) return "";

  const instructions = selectedPatterns
    .map((p) => `### ${p.name}\n${p.instruction}`)
    .join("\n\n");

  return `\n## Quick Apply Patterns\n${instructions}`;
}
