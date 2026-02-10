"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRewriterStore } from "@/lib/store/rewriter-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Wand2,
  FileText,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import type { CourseItem, ItemKind, ItemStatus } from "@/types";
import { itemKey } from "@/types";
import { isAlreadyStyled, detectModelStyleFlags } from "@/lib/validation/rules";
import { DESIGNTOOLS_PATTERNS, buildPatternInstructions } from "@/config/designtools-patterns";

export default function RewritePage() {
  const router = useRouter();
  const {
    items,
    globalInstructions,
    itemPrompts,
    modelStyleGuide,
    modelSignatureSnippets,
    modelContext,
    isLoading,
    error,
    preserveExistingDesignTools,
    skipAlreadyStyled,
    activePatterns,
    updateItem,
    setItemPrompt,
    setLoading,
    setError,
    setCurrentStep,
    getItemCounts,
    setPreserveExistingDesignTools,
    setSkipAlreadyStyled,
    togglePattern,
  } = useRewriterStore();

  const [kindFilter, setKindFilter] = useState<ItemKind | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [enableItemPrompts, setEnableItemPrompts] = useState(false);
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [rewriteProgress, setRewriteProgress] = useState<{
    current: number;
    total: number;
    currentItem: string;
  } | null>(null);
  const [batchTiming, setBatchTiming] = useState<{
    startTime: number;
    itemTimes: number[];
  } | null>(null);
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (kindFilter !== "all" && item.kind !== kindFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    return true;
  });

  const counts = getItemCounts();

  // Toggle item selection
  const toggleItemSelection = (key: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Select all visible items
  const selectAllVisible = () => {
    const keys = filteredItems.map((item) => itemKey(item));
    setSelectedItems(new Set(keys));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Invert selection
  const invertSelection = () => {
    const filteredKeys = new Set(filteredItems.map((item) => itemKey(item)));
    setSelectedItems((prev) => {
      const newSet = new Set<string>();
      filteredKeys.forEach((key) => {
        if (!prev.has(key)) newSet.add(key);
      });
      return newSet;
    });
  };

  // Rewrite a single item
  const rewriteItem = useCallback(
    async (item: CourseItem): Promise<boolean> => {
      const key = itemKey(item);
      const itemSpecificInstructions = enableItemPrompts ? itemPrompts[key] || "" : "";

      // Build full global instructions including pattern instructions
      const patternInstructions = buildPatternInstructions(activePatterns);
      const fullGlobalInstructions = globalInstructions + patternInstructions;

      try {
        const response = await fetch("/api/llm/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item,
            globalInstructions: fullGlobalInstructions,
            itemSpecificInstructions,
            modelStyleGuide,
            modelSignatureSnippets,
            modelContextForFlags: modelContext,
            preserveExistingDesignTools,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Rewrite failed");
        }

        if (data.violations && data.violations.length > 0) {
          updateItem(key, {
            rewrittenHtml: data.rewrittenHtml,
            status: "error",
            error: data.violations.join("; "),
          });
          return false;
        }

        updateItem(key, {
          rewrittenHtml: data.rewrittenHtml,
          status: "rewritten",
          error: null,
        });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        updateItem(key, {
          status: "error",
          error: message,
        });
        return false;
      }
    },
    [
      enableItemPrompts,
      itemPrompts,
      globalInstructions,
      activePatterns,
      modelStyleGuide,
      modelSignatureSnippets,
      modelContext,
      preserveExistingDesignTools,
      updateItem,
    ]
  );

  // Helper to normalize HTML (strip code fences)
  const normalizeHtml = (text: string): string => {
    let html = text.trim();
    if (html.startsWith("```html")) {
      html = html.slice(7);
    } else if (html.startsWith("```")) {
      html = html.slice(3);
    }
    if (html.endsWith("```")) {
      html = html.slice(0, -3);
    }
    return html.trim();
  };

  // Streaming rewrite for a single item (with fallback to non-streaming)
  const rewriteItemStreaming = useCallback(
    async (item: CourseItem): Promise<boolean> => {
      const key = itemKey(item);
      const itemSpecificInstructions = enableItemPrompts ? itemPrompts[key] || "" : "";
      const patternInstructions = buildPatternInstructions(activePatterns);
      const fullGlobalInstructions = globalInstructions + patternInstructions;

      setStreamingContent("");
      setIsStreaming(true);

      try {
        const response = await fetch("/api/llm/rewrite-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item,
            globalInstructions: fullGlobalInstructions,
            itemSpecificInstructions,
            modelStyleGuide,
            modelSignatureSnippets,
            modelContextForFlags: modelContext,
            preserveExistingDesignTools,
          }),
        });

        if (!response.ok) {
          // Fallback to non-streaming endpoint
          console.log("Streaming failed, falling back to non-streaming");
          setIsStreaming(false);
          return rewriteItem(item);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setIsStreaming(false);
          return rewriteItem(item);
        }

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        setIsStreaming(false);

        // If no content was received, fallback to non-streaming
        if (!fullContent.trim()) {
          console.log("No streaming content received, falling back");
          return rewriteItem(item);
        }

        // Normalize the final content
        const rewrittenHtml = normalizeHtml(fullContent);

        // Now validate with the regular endpoint
        try {
          const validateResponse = await fetch("/api/llm/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              originalHtml: item.html,
              rewrittenHtml,
              modelContext: modelContext || modelStyleGuide,
            }),
          });

          if (validateResponse.ok) {
            const validateData = await validateResponse.json();
            if (validateData.violations && validateData.violations.length > 0) {
              updateItem(key, {
                rewrittenHtml,
                status: "error",
                error: validateData.violations.join("; "),
              });
              return false;
            }
          }
        } catch (validateErr) {
          console.error("Validation error:", validateErr);
          // Continue anyway - validation is optional
        }

        updateItem(key, {
          rewrittenHtml,
          status: "rewritten",
          error: null,
        });
        return true;
      } catch (err: unknown) {
        setIsStreaming(false);
        console.error("Streaming error:", err);
        // Fallback to non-streaming on any error
        return rewriteItem(item);
      }
    },
    [
      enableItemPrompts,
      itemPrompts,
      globalInstructions,
      activePatterns,
      modelStyleGuide,
      modelSignatureSnippets,
      modelContext,
      preserveExistingDesignTools,
      updateItem,
      rewriteItem,
    ]
  );

  // Format time in human readable form
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = (): string | null => {
    if (!batchTiming || !rewriteProgress || batchTiming.itemTimes.length === 0) {
      return null;
    }
    const avgTime = batchTiming.itemTimes.reduce((a, b) => a + b, 0) / batchTiming.itemTimes.length;
    const remaining = (rewriteProgress.total - rewriteProgress.current - 1) * avgTime;
    return formatTimeRemaining(remaining);
  };

  // Batch rewrite selected items
  const handleBatchRewrite = async () => {
    if (selectedItems.size === 0) {
      setError("Please select items to rewrite");
      return;
    }

    if (!modelStyleGuide) {
      setError("Please analyze the model course first (Step 2)");
      return;
    }

    setLoading(true);
    setError(null);

    const selectedItemsList = items.filter((item) => selectedItems.has(itemKey(item)));

    // Check for already styled items if skip option is enabled
    let itemsToRewrite = selectedItemsList;
    let skippedCount = 0;

    if (skipAlreadyStyled) {
      const flags = detectModelStyleFlags(modelContext || modelStyleGuide);
      itemsToRewrite = [];

      for (const item of selectedItemsList) {
        const styledResult = isAlreadyStyled(item.html, flags);
        if (styledResult.styled) {
          // Mark as approved and skip
          updateItem(itemKey(item), {
            status: "approved",
            rewrittenHtml: item.html,
            error: null,
          });
          skippedCount++;
        } else {
          itemsToRewrite.push(item);
        }
      }
    }

    if (itemsToRewrite.length === 0) {
      setLoading(false);
      clearSelection();
      if (skippedCount > 0) {
        setError(`All ${skippedCount} items were already styled and auto-approved.`);
      }
      return;
    }

    setRewriteProgress({
      current: 0,
      total: itemsToRewrite.length,
      currentItem: "",
    });

    setBatchTiming({
      startTime: Date.now(),
      itemTimes: [],
    });

    let successCount = 0;

    for (let i = 0; i < itemsToRewrite.length; i++) {
      const item = itemsToRewrite[i];
      setRewriteProgress({
        current: i,
        total: itemsToRewrite.length,
        currentItem: item.title,
      });

      const itemStart = Date.now();
      const success = enableStreaming
        ? await rewriteItemStreaming(item)
        : await rewriteItem(item);
      const itemDuration = (Date.now() - itemStart) / 1000;

      setBatchTiming((prev) => prev ? {
        ...prev,
        itemTimes: [...prev.itemTimes, itemDuration],
      } : null);

      if (success) successCount++;
    }

    setRewriteProgress(null);
    setBatchTiming(null);
    setLoading(false);
    clearSelection();

    // Show summary
    const totalProcessed = itemsToRewrite.length;
    const errorCount = totalProcessed - successCount;

    if (skippedCount > 0 || errorCount > 0) {
      const messages = [];
      if (skippedCount > 0) {
        messages.push(`${skippedCount} already styled (auto-approved)`);
      }
      if (errorCount > 0) {
        messages.push(`${errorCount} had validation errors`);
      }
      setError(`Completed ${successCount}/${totalProcessed} rewrites. ${messages.join(", ")}.`);
    }
  };

  // Rewrite all visible items
  const handleRewriteAllVisible = async () => {
    selectAllVisible();
    // Small delay to ensure state updates
    setTimeout(() => {
      handleBatchRewrite();
    }, 100);
  };

  const handleNext = () => {
    setCurrentStep(4);
    router.push("/review");
  };

  const handleBack = () => {
    router.push("/model");
  };

  const getStatusIcon = (status: ItemStatus) => {
    switch (status) {
      case "original":
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      case "rewritten":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getKindIcon = (kind: ItemKind) => {
    switch (kind) {
      case "page":
        return <FileText className="h-4 w-4" />;
      case "assignment":
        return <ClipboardList className="h-4 w-4" />;
      case "discussion":
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Step 3: Rewrite</h1>
        <p className="text-muted-foreground mt-2">
          Select items and rewrite them using AI to match the model course style.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{counts.original}</div>
            <div className="text-sm text-muted-foreground">Original</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500">{counts.rewritten}</div>
            <div className="text-sm text-muted-foreground">Rewritten</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{counts.approved}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{counts.error}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <Label className="mb-2 block">Type</Label>
              <Select
                value={kindFilter}
                onValueChange={(v) => setKindFilter(v as ItemKind | "all")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="page">Pages</SelectItem>
                  <SelectItem value="assignment">Assignments</SelectItem>
                  <SelectItem value="discussion">Discussions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <Label className="mb-2 block">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as ItemStatus | "all")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="original">Original</SelectItem>
                  <SelectItem value="rewritten">Rewritten</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-48">
              <Label className="mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={selectAllVisible}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={invertSelection}>
                Invert
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewrite Options */}
      <Card>
        <CardHeader>
          <CardTitle>Rewrite Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="preserveExistingDesignTools"
              checked={preserveExistingDesignTools}
              onCheckedChange={(checked) => setPreserveExistingDesignTools(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="preserveExistingDesignTools" className="font-medium">
                Preserve existing DesignTools elements
              </Label>
              <p className="text-xs text-muted-foreground">
                Keep existing dp-* structures that match the model. Only enhance unstyled areas.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="skipAlreadyStyled"
              checked={skipAlreadyStyled}
              onCheckedChange={(checked) => setSkipAlreadyStyled(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="skipAlreadyStyled" className="font-medium">
                Skip items that are already styled
              </Label>
              <p className="text-xs text-muted-foreground">
                Auto-approve items that already have 60%+ DesignTools styling confidence.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="enableItemPrompts"
              checked={enableItemPrompts}
              onCheckedChange={(checked) => setEnableItemPrompts(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="enableItemPrompts" className="font-medium">
                Enable item-specific prompts
              </Label>
              <p className="text-xs text-muted-foreground">
                Click an item to add custom instructions for that specific rewrite.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="enableStreaming"
              checked={enableStreaming}
              onCheckedChange={(checked) => setEnableStreaming(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="enableStreaming" className="font-medium">
                Show live LLM output
              </Label>
              <p className="text-xs text-muted-foreground">
                Display real-time streaming preview as the AI generates content.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Apply DesignTools Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Apply Patterns</CardTitle>
          <CardDescription>
            Toggle patterns to include specific styling instructions in the rewrite.
            {activePatterns.length > 0 && (
              <span className="ml-2 text-primary">({activePatterns.length} active)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DESIGNTOOLS_PATTERNS.map((pattern) => {
              const isActive = activePatterns.includes(pattern.id);
              return (
                <Button
                  key={pattern.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePattern(pattern.id)}
                  title={pattern.description}
                  className="gap-1"
                >
                  {isActive && <CheckCircle className="h-3 w-3" />}
                  {pattern.name}
                </Button>
              );
            })}
          </div>
          {activePatterns.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Active patterns will be appended to global instructions during rewrite.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Rewrite Progress */}
      {rewriteProgress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Rewriting items...</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {rewriteProgress.currentItem}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">
                    {rewriteProgress.current + 1} / {rewriteProgress.total}
                  </span>
                  {getEstimatedTimeRemaining() && (
                    <p className="text-xs text-muted-foreground">
                      ~{getEstimatedTimeRemaining()} remaining
                    </p>
                  )}
                </div>
              </div>
              <Progress
                value={((rewriteProgress.current + 1) / rewriteProgress.total) * 100}
              />
              {batchTiming && batchTiming.itemTimes.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Avg: {(batchTiming.itemTimes.reduce((a, b) => a + b, 0) / batchTiming.itemTimes.length).toFixed(1)}s per item
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Streaming Preview */}
      {isStreaming && enableStreaming && streamingContent && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Live Preview
            </CardTitle>
            <CardDescription>
              Watching AI generate content in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-white max-h-80 overflow-y-auto">
              <div className="p-4 font-mono text-sm whitespace-pre-wrap">
                {streamingContent}
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Items ({filteredItems.length})
            {selectedItems.size > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({selectedItems.size} selected)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="w-10 p-2"></th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const key = itemKey(item);
                  const isSelected = selectedItems.has(key);
                  const hasItemPrompt = itemPrompts[key];

                  // Check if already styled (for badge display)
                  const flags = detectModelStyleFlags(modelContext || modelStyleGuide);
                  const styledResult = item.status === "original" ? isAlreadyStyled(item.html, flags) : null;

                  return (
                    <tr
                      key={key}
                      className={`border-t cursor-pointer hover:bg-muted/50 ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                      onClick={() => {
                        if (enableItemPrompts) {
                          setEditingItemKey(key);
                        } else {
                          toggleItemSelection(key);
                        }
                      }}
                    >
                      <td className="p-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleItemSelection(key)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {getKindIcon(item.kind)}
                          <span className="capitalize">{item.kind}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {item.title}
                          {hasItemPrompt && (
                            <Badge variant="outline" className="text-xs">
                              Custom
                            </Badge>
                          )}
                          {styledResult?.styled && (
                            <Badge variant="secondary" className="text-xs" title={styledResult.reasons.join(", ")}>
                              Styled ({Math.round(styledResult.confidence * 100)}%)
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </div>
                      </td>
                      <td className="p-2 max-w-48">
                        {item.error && (
                          <span className="text-xs text-red-500 truncate block">
                            {item.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No items match the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Item Prompt Editor Modal/Card */}
      {editingItemKey && enableItemPrompts && (
        <Card>
          <CardHeader>
            <CardTitle>
              Item-Specific Instructions
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={() => setEditingItemKey(null)}
              >
                Close
              </Button>
            </CardTitle>
            <CardDescription>
              {items.find((i) => itemKey(i) === editingItemKey)?.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter specific instructions for this item..."
              value={itemPrompts[editingItemKey] || ""}
              onChange={(e) => setItemPrompt(editingItemKey, e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleRewriteAllVisible}
            disabled={isLoading || filteredItems.length === 0}
          >
            Rewrite All Visible ({filteredItems.length})
          </Button>

          <Button
            onClick={handleBatchRewrite}
            disabled={isLoading || selectedItems.size === 0}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Wand2 className="h-4 w-4" />
            Rewrite Selected ({selectedItems.size})
          </Button>

          <Button onClick={handleNext} size="lg">
            Next: Review
          </Button>
        </div>
      </div>
    </div>
  );
}
