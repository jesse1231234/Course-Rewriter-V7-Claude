// ============================================================
// Canvas Item Types
// ============================================================

export type ItemKind = "page" | "assignment" | "discussion";
export type ItemStatus = "original" | "rewritten" | "approved" | "error";

export interface CourseItem {
  kind: ItemKind;
  title: string;
  canvasId: string | number; // page_url (string) or id (number)
  html: string;
  url?: string;

  // Rewrite state
  rewrittenHtml: string | null;
  approved: boolean;
  status: ItemStatus;
  error: string | null;
}

// Helper to generate unique key for an item
export function itemKey(item: CourseItem): string {
  return `${item.kind}:${item.canvasId}`;
}

// ============================================================
// Store Types
// ============================================================

export interface RewriterState {
  // Connection
  canvasBaseUrl: string;
  canvasToken: string;
  targetCourseId: string;
  modelCourseId: string;
  targetCourseName: string;
  modelCourseName: string;

  // Content
  items: CourseItem[];
  globalInstructions: string;
  itemPrompts: Record<string, string>; // key is itemKey(item)

  // Content type filters for loading
  includePages: boolean;
  includeAssignments: boolean;
  includeDiscussions: boolean;

  // Model Course
  modelContext: string;
  modelStyleGuide: string;
  modelSignatureSnippets: string;
  modelSampleCounts: {
    pages: number;
    assignments: number;
    discussions: number;
  };

  // UI State
  currentStep: number; // 1-5
  isLoading: boolean;
  error: string | null;

  // Rewrite Options
  preserveExistingDesignTools: boolean;
  skipAlreadyStyled: boolean;
  activePatterns: string[];
}

export interface RewriterActions {
  // Connection actions
  setCanvasConfig: (baseUrl: string, token: string) => void;
  setTargetCourse: (id: string, name: string) => void;
  setModelCourse: (id: string, name: string) => void;

  // Items actions
  setItems: (items: CourseItem[]) => void;
  updateItem: (key: string, updates: Partial<CourseItem>) => void;
  updateItems: (updates: Array<{ key: string; updates: Partial<CourseItem> }>) => void;

  // Content type filters
  setIncludePages: (include: boolean) => void;
  setIncludeAssignments: (include: boolean) => void;
  setIncludeDiscussions: (include: boolean) => void;

  // Instructions
  setGlobalInstructions: (instructions: string) => void;
  setItemPrompt: (key: string, prompt: string) => void;

  // Model course
  setModelContext: (context: string) => void;
  setModelStyleGuide: (guide: string) => void;
  setModelSignatureSnippets: (snippets: string) => void;
  setModelSampleCounts: (counts: { pages: number; assignments: number; discussions: number }) => void;

  // Navigation
  setCurrentStep: (step: number) => void;

  // Loading/Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Rewrite Options
  setPreserveExistingDesignTools: (preserve: boolean) => void;
  setSkipAlreadyStyled: (skip: boolean) => void;
  setActivePatterns: (patterns: string[]) => void;
  togglePattern: (patternId: string) => void;

  // Computed getters
  getFilteredItems: (
    kindFilter: ItemKind[],
    statusFilter: ItemStatus[],
    searchQuery: string
  ) => CourseItem[];
  getItemCounts: () => Record<ItemStatus, number>;
  getApprovedItems: () => CourseItem[];

  // Reset
  reset: () => void;
}

export type RewriterStore = RewriterState & RewriterActions;

// ============================================================
// API Types
// ============================================================

export interface LoadItemsRequest {
  courseId: string;
  includePages: boolean;
  includeAssignments: boolean;
  includeDiscussions: boolean;
}

export interface LoadItemsResponse {
  items: CourseItem[];
  courseName: string;
}

export interface GenerateStyleGuideRequest {
  modelContext: string;
}

export interface GenerateStyleGuideResponse {
  styleGuide: string;
}

export interface RewriteRequest {
  item: CourseItem;
  globalInstructions: string;
  itemSpecificInstructions: string;
  modelStyleGuide: string;
  modelSignatureSnippets: string;
  modelContextForFlags: string;
}

export interface RewriteResponse {
  rewrittenHtml: string;
  violations: string[];
}

export interface ValidateRequest {
  originalHtml: string;
  rewrittenHtml: string;
  modelContext: string;
}

export interface ValidateResponse {
  valid: boolean;
  violations: string[];
}

export interface PublishRequest {
  courseId: string;
  items: Array<{
    kind: ItemKind;
    canvasId: string | number;
    html: string;
  }>;
  dryRun: boolean;
}

export interface PublishResponse {
  success: boolean;
  results: Array<{
    canvasId: string | number;
    success: boolean;
    error?: string;
  }>;
}

// ============================================================
// Validation Types
// ============================================================

export interface StyleFlags {
  requireEmbedWrapper: boolean;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (original: string, rewritten: string, flags: StyleFlags) => string | null;
}

// ============================================================
// Canvas API Types (raw responses)
// ============================================================

export interface CanvasPage {
  page_id: number;
  url: string;
  title: string;
  body: string;
  published: boolean;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description: string;
  published: boolean;
  html_url: string;
}

export interface CanvasDiscussion {
  id: number;
  title: string;
  message: string;
  published: boolean;
  html_url: string;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
}
