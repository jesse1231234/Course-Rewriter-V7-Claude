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
    updateItem,
    setItemPrompt,
    setLoading,
    setError,
    setCurrentStep,
    getItemCounts,
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

  // Rewrite a single item
  const rewriteItem = useCallback(
    async (item: CourseItem): Promise<boolean> => {
      const key = itemKey(item);
      const itemSpecificInstructions = enableItemPrompts ? itemPrompts[key] || "" : "";

      try {
        const response = await fetch("/api/llm/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item,
            globalInstructions,
            itemSpecificInstructions,
            modelStyleGuide,
            modelSignatureSnippets,
            modelContextForFlags: modelContext,
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
      modelStyleGuide,
      modelSignatureSnippets,
      modelContext,
      updateItem,
    ]
  );

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

    const itemsToRewrite = items.filter((item) => selectedItems.has(itemKey(item)));

    setRewriteProgress({
      current: 0,
      total: itemsToRewrite.length,
      currentItem: "",
    });

    let successCount = 0;

    for (let i = 0; i < itemsToRewrite.length; i++) {
      const item = itemsToRewrite[i];
      setRewriteProgress({
        current: i,
        total: itemsToRewrite.length,
        currentItem: item.title,
      });

      const success = await rewriteItem(item);
      if (success) successCount++;
    }

    setRewriteProgress(null);
    setLoading(false);
    clearSelection();

    // Show summary
    if (successCount === itemsToRewrite.length) {
      // All successful - no error needed
    } else {
      setError(
        `Completed ${successCount}/${itemsToRewrite.length} rewrites. ${itemsToRewrite.length - successCount} had validation errors.`
      );
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
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item-specific prompts toggle */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableItemPrompts"
              checked={enableItemPrompts}
              onCheckedChange={(checked) => setEnableItemPrompts(checked as boolean)}
            />
            <Label htmlFor="enableItemPrompts">
              Enable item-specific prompts (click item to edit)
            </Label>
          </div>
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
                <span className="text-sm text-muted-foreground">
                  {rewriteProgress.current + 1} / {rewriteProgress.total}
                </span>
              </div>
              <Progress
                value={((rewriteProgress.current + 1) / rewriteProgress.total) * 100}
              />
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
