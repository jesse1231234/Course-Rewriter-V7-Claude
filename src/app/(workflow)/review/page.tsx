"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRewriterStore } from "@/lib/store/rewriter-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  FileText,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import type { CourseItem, ItemKind, ItemStatus } from "@/types";
import { itemKey } from "@/types";
import { DesignToolsPreview, RawHtmlPreview } from "@/components/preview/DesignToolsPreview";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function ReviewPage() {
  const router = useRouter();
  const {
    items,
    error,
    updateItem,
    setError,
    setCurrentStep,
    getItemCounts,
  } = useRewriterStore();

  const [kindFilter, setKindFilter] = useState<ItemKind | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [useDesignToolsCSS, setUseDesignToolsCSS] = useState(true);

  useEffect(() => {
    setCurrentStep(4);
  }, [setCurrentStep]);

  const counts = getItemCounts();

  // Filter items for review (only rewritten or error items make sense to review)
  const reviewableItems = items.filter((item) => {
    if (kindFilter !== "all" && item.kind !== kindFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    // Only show items that have been rewritten
    if (!item.rewrittenHtml && item.status !== "error") return false;
    return true;
  });

  const currentItem = reviewableItems[selectedIndex];

  // Navigate between items
  const goToPrevious = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex < reviewableItems.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  // Approve current item
  const approveItem = () => {
    if (!currentItem) return;
    const key = itemKey(currentItem);
    updateItem(key, {
      approved: true,
      status: "approved",
    });
    // Auto-advance to next
    if (selectedIndex < reviewableItems.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  // Reject/unapprove current item
  const rejectItem = () => {
    if (!currentItem) return;
    const key = itemKey(currentItem);
    updateItem(key, {
      approved: false,
      status: "rewritten",
    });
  };

  // Batch approve all visible
  const approveAllVisible = () => {
    for (const item of reviewableItems) {
      if (item.rewrittenHtml && item.status !== "error") {
        updateItem(itemKey(item), {
          approved: true,
          status: "approved",
        });
      }
    }
  };

  const handleNext = () => {
    const approvedCount = items.filter((i) => i.approved && i.rewrittenHtml).length;
    if (approvedCount === 0) {
      setError("Please approve at least one item before publishing");
      return;
    }
    setCurrentStep(5);
    router.push("/publish");
  };

  const handleBack = () => {
    router.push("/rewrite");
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Step 4: Review</h1>
        <p className="text-muted-foreground mt-2">
          Review rewritten content side-by-side and approve items for publishing.
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
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
            <div className="text-sm text-green-600">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{counts.error}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Navigation */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-40">
              <Select
                value={kindFilter}
                onValueChange={(v) => {
                  setKindFilter(v as ItemKind | "all");
                  setSelectedIndex(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
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
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as ItemStatus | "all");
                  setSelectedIndex(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="rewritten">Rewritten</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                disabled={selectedIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-24 text-center">
                {reviewableItems.length > 0
                  ? `${selectedIndex + 1} of ${reviewableItems.length}`
                  : "No items"}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                disabled={selectedIndex >= reviewableItems.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" onClick={approveAllVisible}>
              Approve All Visible ({reviewableItems.filter((i) => i.status !== "error").length})
            </Button>
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

      {/* Current Item Info */}
      {currentItem && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getKindIcon(currentItem.kind)}
                <CardTitle>{currentItem.title}</CardTitle>
                <Badge
                  variant={
                    currentItem.status === "approved"
                      ? "success"
                      : currentItem.status === "error"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {currentItem.status}
                </Badge>
                {currentItem.approved && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="flex gap-2">
                {currentItem.status !== "error" && (
                  <>
                    {currentItem.approved ? (
                      <Button variant="outline" onClick={rejectItem} className="gap-2">
                        <ThumbsDown className="h-4 w-4" />
                        Unapprove
                      </Button>
                    ) : (
                      <Button onClick={approveItem} className="gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        Approve
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            {currentItem.error && (
              <CardDescription className="text-red-500">
                <XCircle className="h-4 w-4 inline mr-1" />
                {currentItem.error}
              </CardDescription>
            )}
          </CardHeader>
        </Card>
      )}

      {/* Preview Options */}
      {currentItem && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useDesignToolsCSS"
                checked={useDesignToolsCSS}
                onCheckedChange={(checked) => setUseDesignToolsCSS(checked as boolean)}
              />
              <Label htmlFor="useDesignToolsCSS">
                Preview with DesignTools CSS
              </Label>
              <span className="text-xs text-muted-foreground ml-2">
                (Requires designtools.css in public folder)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Side-by-Side Preview */}
      {currentItem && (
        <div className="grid grid-cols-2 gap-4">
          {/* Original */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Original</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                {useDesignToolsCSS ? (
                  <DesignToolsPreview
                    html={currentItem.html || "<p>(empty)</p>"}
                    height={600}
                  />
                ) : (
                  <RawHtmlPreview
                    html={currentItem.html || "<p>(empty)</p>"}
                    height={600}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rewritten */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Proposed Rewrite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                {useDesignToolsCSS ? (
                  <DesignToolsPreview
                    html={currentItem.rewrittenHtml || "<p>(not yet rewritten)</p>"}
                    height={600}
                  />
                ) : (
                  <RawHtmlPreview
                    html={currentItem.rewrittenHtml || "<p>(not yet rewritten)</p>"}
                    height={600}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No items message */}
      {reviewableItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No items match the current filters. Try selecting different filters
              or go back to rewrite some items.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>

        <Button onClick={handleNext} size="lg" disabled={counts.approved === 0}>
          Next: Publish ({counts.approved} approved)
        </Button>
      </div>
    </div>
  );
}
