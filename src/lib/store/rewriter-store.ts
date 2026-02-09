import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  RewriterStore,
  RewriterState,
  CourseItem,
  ItemKind,
  ItemStatus,
} from "@/types";
import { itemKey } from "@/types";

const initialState: RewriterState = {
  // Connection
  canvasBaseUrl: "",
  canvasToken: "",
  targetCourseId: "",
  modelCourseId: "",
  targetCourseName: "",
  modelCourseName: "",

  // Content
  items: [],
  globalInstructions: "",
  itemPrompts: {},

  // Content type filters
  includePages: true,
  includeAssignments: true,
  includeDiscussions: true,

  // Model Course
  modelContext: "",
  modelStyleGuide: "",
  modelSignatureSnippets: "",
  modelSampleCounts: {
    pages: 3,
    assignments: 2,
    discussions: 2,
  },

  // UI State
  currentStep: 1,
  isLoading: false,
  error: null,
};

export const useRewriterStore = create<RewriterStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Connection actions
      setCanvasConfig: (baseUrl, token) =>
        set({ canvasBaseUrl: baseUrl, canvasToken: token }),

      setTargetCourse: (id, name) =>
        set({ targetCourseId: id, targetCourseName: name }),

      setModelCourse: (id, name) =>
        set({ modelCourseId: id, modelCourseName: name }),

      // Items actions
      setItems: (items) => set({ items }),

      updateItem: (key, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            itemKey(item) === key ? { ...item, ...updates } : item
          ),
        })),

      updateItems: (updates) =>
        set((state) => {
          const updateMap = new Map(updates.map((u) => [u.key, u.updates]));
          return {
            items: state.items.map((item) => {
              const itemUpdates = updateMap.get(itemKey(item));
              return itemUpdates ? { ...item, ...itemUpdates } : item;
            }),
          };
        }),

      // Content type filters
      setIncludePages: (include) => set({ includePages: include }),
      setIncludeAssignments: (include) => set({ includeAssignments: include }),
      setIncludeDiscussions: (include) => set({ includeDiscussions: include }),

      // Instructions
      setGlobalInstructions: (instructions) =>
        set({ globalInstructions: instructions }),

      setItemPrompt: (key, prompt) =>
        set((state) => ({
          itemPrompts: { ...state.itemPrompts, [key]: prompt },
        })),

      // Model course
      setModelContext: (context) => set({ modelContext: context }),
      setModelStyleGuide: (guide) => set({ modelStyleGuide: guide }),
      setModelSignatureSnippets: (snippets) =>
        set({ modelSignatureSnippets: snippets }),
      setModelSampleCounts: (counts) => set({ modelSampleCounts: counts }),

      // Navigation
      setCurrentStep: (step) => set({ currentStep: step }),

      // Loading/Error
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Computed getters
      getFilteredItems: (kindFilter, statusFilter, searchQuery) => {
        const { items } = get();
        return items.filter((item) => {
          if (kindFilter.length && !kindFilter.includes(item.kind)) return false;
          if (statusFilter.length && !statusFilter.includes(item.status))
            return false;
          if (
            searchQuery &&
            !item.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
            return false;
          return true;
        });
      },

      getItemCounts: () => {
        const { items } = get();
        return {
          original: items.filter((i) => i.status === "original").length,
          rewritten: items.filter((i) => i.status === "rewritten").length,
          approved: items.filter((i) => i.status === "approved").length,
          error: items.filter((i) => i.status === "error").length,
        };
      },

      getApprovedItems: () => {
        const { items } = get();
        return items.filter((i) => i.approved && i.rewrittenHtml);
      },

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: "course-rewriter-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
